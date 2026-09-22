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

        $truncatableTables = $this->getTruncatableTables();
        if ([] === $truncatableTables) {
            return;
        }

        $connection->beginTransaction();
        try {
            $connection->executeStatement(sprintf(
                'TRUNCATE %s RESTART IDENTITY CASCADE',
                implode(', ', array_map([$this, 'quoteTableName'], $truncatableTables))
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
     * @return list<string>
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

        self::$truncatableTables = $truncatableTables;

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
