<?php declare(strict_types=1);

namespace App\Tests;

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

    private function truncateDatabase(): void
    {
        $connection = $this->entityManager->getConnection();
        $databasePlatform = $connection->getDatabasePlatform();

        $this->entityManager->clear();
        $connection->executeStatement("SET synchronous_commit = OFF");

        $connection->beginTransaction();
        try {
            foreach ($this->getTruncatableTables() as $tableName) {
                $connection->executeStatement(
                    $databasePlatform->getTruncateTableSQL($tableName, true)
                );
            }
            $connection->commit();
        } catch (\Throwable $e) {
            $connection->rollBack();
            throw $e;
        }
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
}
