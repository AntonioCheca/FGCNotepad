<?php

namespace App\Tests;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class DatabaseTestCase extends WebTestCase
{
    protected ?EntityManagerInterface $entityManager = null;
    protected ?KernelBrowser $client = null;

    protected function setUp(): void
    {
        if (null === $this->entityManager) {
            $this->client = self::createClient();
            self::bootKernel();
            $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
        }

        $this->truncateDatabase();
    }

    private function truncateDatabase(): void
    {
        $connection = $this->entityManager->getConnection();
        $databasePlatform = $connection->getDatabasePlatform();
        $allMetadata = $this->entityManager->getMetadataFactory()->getAllMetadata();
        $schemaManager = $connection->createSchemaManager();
        $existingTables = array_map(
            static fn (string $name): string => mb_strtolower($name),
            $schemaManager->listTableNames()
        );
        $existingTableLookup = array_fill_keys($existingTables, true);

        $this->entityManager->clear();
        $connection->executeStatement("SET synchronous_commit = OFF");

        $connection->beginTransaction();
        try {
            foreach ($allMetadata as $classMetadata) {
                $tableName = $classMetadata->getSchemaName()
                    ? sprintf('%s.%s', $classMetadata->getSchemaName(), $classMetadata->getTableName())
                    : $classMetadata->getTableName();

                if (!isset($existingTableLookup[mb_strtolower($tableName)])) {
                    continue;
                }

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
}
