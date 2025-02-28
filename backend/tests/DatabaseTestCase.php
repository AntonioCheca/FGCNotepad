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
        if(null === $this->entityManager) {
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

        $entities = [Post::class, User::class];

        foreach ($entities as $entity) {
            $query = $databasePlatform->getTruncateTableSQL(
                $this->entityManager->getClassMetadata($entity)->getTableName(),
                true,
            );
            $connection->executeStatement($query);
        }
    }
}
