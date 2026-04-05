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

        $this->entityManager->clear();
        $connection->executeStatement("SET synchronous_commit = OFF");

        $connection->beginTransaction();
        try {
            foreach ($allMetadata as $classMetadata) {
                $tableName = $classMetadata->getSchemaName()
                    ? sprintf('%s.%s', $classMetadata->getSchemaName(), $classMetadata->getTableName())
                    : $classMetadata->getTableName();

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