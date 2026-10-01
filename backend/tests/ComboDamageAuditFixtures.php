<?php declare(strict_types=1);

namespace App\Tests;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\Visibility;
use App\Service\ComboSequenceCreationService;
use Doctrine\ORM\EntityManagerInterface;

/** A Ryu catalogue of 5MP (600), 236HP (1200) and a 66 dash without frame-data damage, plus combos built from it. */
final class ComboDamageAuditFixtures
{
    /** @var array<string, ComboSequences> */
    private array $leafs = [];
    private ConnectionType $connection;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ComboSequenceCreationService $creationService,
    ) {
        $character = (new Character())->setName('Ryu');
        $this->connection = (new ConnectionType())->setName('Link');
        $leafType = (new ComboSequenceType())->setName('leaf');
        $visibility = (new Visibility())->setName('public');
        foreach ([$character, $this->connection, $leafType, $visibility, (new ComboSequenceType())->setName('combo')] as $entity) {
            $this->entityManager->persist($entity);
        }

        foreach ([['5MP', 'normal', 600], ['236HP', 'special', 1200], ['66', 'normal', null]] as [$notation, $moveType, $damage]) {
            $frameData = (new FrameData())->setMoveType($moveType);
            if (null !== $damage) {
                $frameData->setDamage($damage);
            }
            $move = (new Move())->setCharacter($character)->setNumpadNotation($notation);
            $move->setFrameData($frameData);
            $leaf = (new ComboSequences())->setName('Ryu - ' . $notation)->setDescription('leaf')->setMove($move)->setType($leafType)->setVisibility($visibility);
            $this->entityManager->persist($frameData);
            $this->entityManager->persist($move);
            $this->entityManager->persist($leaf);
            $this->leafs[$notation] = $leaf;
        }
        $this->entityManager->flush();
    }

    /**
     * @param list<string> $notations
     * @param array<string, bool> $requirements
     */
    public function createCombo(array $notations, int $damage, array $requirements = []): int
    {
        $steps = [];
        foreach ($notations as $index => $notation) {
            $steps[] = ['child_sequence_id' => $this->leafs[$notation]->getId(), 'ordinal_in_combo' => $index + 1, 'connection_type_id' => $this->connection->getId()];
        }

        return (int) $this->creationService->createFromPayload(
            ['name' => implode(' > ', $notations), 'description' => '', 'visibility' => 'public', 'metrics' => ['damage' => $damage], 'requirements' => $requirements],
            'combo',
            $steps,
        )->getId();
    }
}
