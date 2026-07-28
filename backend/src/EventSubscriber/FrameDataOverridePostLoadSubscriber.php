<?php declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\FrameData;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;

#[AsDoctrineListener(event: Events::postLoad)]
class FrameDataOverridePostLoadSubscriber
{
    public function __construct(private readonly Connection $connection)
    {
    }

    public function postLoad(LifecycleEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof FrameData || null === $entity->getId()) {
            return;
        }

        $rows = $this->connection->fetchAllAssociative(
            'SELECT column_name, override_value FROM sf6.frame_data_override WHERE frame_data_id = :frameDataId',
            ['frameDataId' => $entity->getId()->toRfc4122()]
        );

        $overrides = [];
        foreach ($rows as $row) {
            if (!is_string($row['column_name'])) {
                continue;
            }

            $rawValue = $row['override_value'] ?? null;
            $overrides[$row['column_name']] = is_string($rawValue) ? json_decode($rawValue, true) : $rawValue;
        }

        $entity->applyEffectiveOverrides($overrides);
    }
}
