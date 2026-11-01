<?php declare(strict_types=1);

namespace App\Tests;

use App\Entity\CharacterObject;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class DatabaseTestCase extends WebTestCase
{
    /**
     * @var list<string>|null
     */
    private static ?array $truncatableTables = null;

    protected ?EntityManagerInterface $entityManager = null;
    protected ?KernelBrowser $client = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = static::createClient();
        $this->client->disableReboot();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
        static::getContainer()->get('cache.rate_limiter')->clear();

        $this->truncateDatabase();
    }

    protected function tearDown(): void
    {
        if (null !== $this->entityManager) {
            $this->entityManager->clear();
        }

        $this->entityManager = null;
        $this->client = null;

        parent::tearDown();
    }

    protected function seedCharacterResources(): void
    {
        $definitions = [
            ['Jamie', 'jamie_drinks', 'Drinks', CharacterObject::KIND_SCALER, 'integer', 4, false],
            ['Ryu', 'ryu_denjin_charge', 'Denjin Charge', CharacterObject::KIND_STOCK, 'boolean', null, true],
        ];
        foreach ($definitions as [$characterName, $key, $name, $kind, $statusType, $max, $consumed]) {
            $this->entityManager->persist(
                (new CharacterObject())
                    ->setCharacterName($characterName)
                    ->setObjectKey($key)
                    ->setName($name)
                    ->setKind($kind)
                    ->setStatusType($statusType)
                    ->setMaxStatus($max)
                    ->setCanBeConsumed($consumed)
                    ->setCanBeAddedRelative(true)
            );
        }
        $this->entityManager->flush();
    }

    private function truncateDatabase(): void
    {
        $connection = $this->entityManager->getConnection();

        $this->entityManager->clear();
        $connection->executeStatement("SET synchronous_commit = OFF");

        $dirtyTables = $this->getDirtyTables($this->getTruncatableTables());
        if ([] === $dirtyTables) {
            return;
        }

        // DELETE is milliseconds on these small tables, while TRUNCATE recreates each table's files. Skipping
        // FK triggers needs a superuser, so other setups fall back to TRUNCATE.
        $connection->beginTransaction();
        try {
            $connection->executeStatement('SET LOCAL session_replication_role = replica');
            foreach ($dirtyTables as $table) {
                $connection->executeStatement(sprintf('DELETE FROM %s', $table));
            }
            $connection->executeQuery(sprintf(
                "SELECT setval(s.oid::regclass, ps.start_value, false)
                FROM pg_depend d
                JOIN pg_class s ON s.oid = d.objid AND s.relkind = 'S'
                JOIN pg_namespace n ON n.oid = s.relnamespace
                JOIN pg_sequences ps ON ps.schemaname = n.nspname AND ps.sequencename = s.relname
                WHERE d.classid = 'pg_class'::regclass AND d.refclassid = 'pg_class'::regclass
                  AND d.refobjid IN (%s)",
                implode(', ', array_map(static fn (string $table): string => $connection->quote($table) . '::regclass', $dirtyTables))
            ));
            $connection->commit();

            return;
        } catch (\Throwable) {
            $connection->rollBack();
        }

        $connection->beginTransaction();
        try {
            $connection->executeStatement(sprintf(
                'TRUNCATE %s RESTART IDENTITY CASCADE',
                implode(', ', $dirtyTables)
            ));
            $connection->commit();
        } catch (\Throwable $e) {
            $connection->rollBack();
            throw $e;
        }
    }

    protected static function hashTestPassword(string $password = 'testpassword'): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 4]);
    }

    /**
     * TRUNCATE rewrites every listed table's files, which costs about a second per test for the whole schema.
     * Only tables holding rows, or whose owned id sequence was used since its last reset, need it.
     *
     * @param list<string> $tables quoted table names
     *
     * @return list<string> quoted table names
     */
    private function getDirtyTables(array $tables): array
    {
        if ([] === $tables) {
            return [];
        }

        $connection = $this->entityManager->getConnection();
        $checks = array_map(
            static fn (string $quoted): string => sprintf(
                "SELECT %s WHERE EXISTS (SELECT 1 FROM %s) OR EXISTS (
                    SELECT 1 FROM pg_depend d
                    JOIN pg_class s ON s.oid = d.objid AND s.relkind = 'S'
                    JOIN pg_namespace n ON n.oid = s.relnamespace
                    JOIN pg_sequences ps ON ps.schemaname = n.nspname AND ps.sequencename = s.relname
                    WHERE d.classid = 'pg_class'::regclass AND d.refclassid = 'pg_class'::regclass
                      AND d.refobjid = %s::regclass AND ps.last_value IS NOT NULL
                )",
                $connection->quote($quoted),
                $quoted,
                $connection->quote($quoted)
            ),
            $tables
        );

        return array_map('strval', $connection->fetchFirstColumn(implode(' UNION ALL ', $checks)));
    }

    /**
     * @return list<string> quoted table names
     */
    private function getTruncatableTables(): array
    {
        if (null !== self::$truncatableTables) {
            return self::$truncatableTables;
        }

        $connection = $this->entityManager->getConnection();
        $schemaManager = $connection->createSchemaManager();
        $existingTableLookup = [];

        foreach ($schemaManager->listTableNames() as $existingTableName) {
            foreach ($this->normalizeTableNameVariants($existingTableName) as $normalizedTableName) {
                $existingTableLookup[$normalizedTableName] = true;
            }
        }

        $truncatableTables = [];

        foreach ($this->entityManager->getMetadataFactory()->getAllMetadata() as $classMetadata) {
            $tableName = $classMetadata->getSchemaName()
                ? sprintf('%s.%s', $classMetadata->getSchemaName(), $classMetadata->getTableName())
                : $classMetadata->getTableName();

            foreach ($this->normalizeTableNameVariants($tableName) as $tableNameVariant) {
                if (isset($existingTableLookup[$tableNameVariant])) {
                    $truncatableTables[] = $tableName;
                    break;
                }
            }
        }

        if ([] === $truncatableTables) {
            return self::$truncatableTables = [];
        }

        // Tables that reference entity tables (join tables and the like) were emptied by TRUNCATE ... CASCADE.
        $entityTables = array_map(
            fn (string $table): string => $connection->quote($this->quoteTableName($table)),
            $truncatableTables
        );
        self::$truncatableTables = array_map('strval', $connection->fetchFirstColumn(sprintf(
            "WITH RECURSIVE reset_tables(oid) AS (
                SELECT unnest(ARRAY[%s]::regclass[])::oid
                UNION
                SELECT c.conrelid FROM pg_constraint c JOIN reset_tables r ON c.confrelid = r.oid WHERE c.contype = 'f'
            )
            SELECT format('%%I.%%I', n.nspname, t.relname)
            FROM reset_tables r
            JOIN pg_class t ON t.oid = r.oid
            JOIN pg_namespace n ON n.oid = t.relnamespace",
            implode(', ', $entityTables)
        )));

        return self::$truncatableTables;
    }

    /**
     * @return list<string>
     */
    private function normalizeTableNameVariants(string $tableName): array
    {
        $lowerName = mb_strtolower($tableName);
        $normalizedName = str_replace('"', '', $lowerName);
        $variants = [$normalizedName];

        if (str_contains($normalizedName, '.')) {
            $segments = explode('.', $normalizedName);
            $lastSegment = end($segments);
            if (false !== $lastSegment && '' !== $lastSegment) {
                $variants[] = $lastSegment;
            }
        }

        return array_values(array_unique($variants));
    }

    private function quoteTableName(string $tableName): string
    {
        $platform = $this->entityManager->getConnection()->getDatabasePlatform();

        return implode('.', array_map(
            static fn (string $segment): string => $platform->quoteIdentifier(str_replace('"', '', $segment)),
            explode('.', $tableName)
        ));
    }
}
