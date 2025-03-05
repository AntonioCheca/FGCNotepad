<?php

namespace App\Tests;

use App\Entity\Post;
use App\Entity\User;
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

        foreach ($allMetadata as $classMetadata) {
            $fullyQualifiedNameForTable = sprintf("%s.%s", $classMetadata->getSchemaName(), $classMetadata->getTableName());
            $query = $databasePlatform->getTruncateTableSQL(
                $fullyQualifiedNameForTable,
                true,
            );
            $connection->executeStatement($query);
        }
    }
}
