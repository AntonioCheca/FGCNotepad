<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Move;
use App\Entity\MoveManualMetadata;
use App\Entity\User;
use App\Repository\MoveManualMetadataRepository;
use Doctrine\ORM\EntityManagerInterface;

class MoveManualMetadataService
{
    public function __construct(
        private readonly MoveManualMetadataRepository $moveManualMetadataRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @param list<Move> $moves
     *
     * @return array<string, MoveManualMetadata>
     */
    public function findMapForMoves(array $moves): array
    {
        return $this->moveManualMetadataRepository->findMapForMoves($moves);
    }

    public function saveMetadata(Move $move, bool $whiffOnCrouch, bool $forcesStanding, User $actor): MoveManualMetadata
    {
        $metadata = $this->moveManualMetadataRepository->findOneBy(['move' => $move]);
        if (!$metadata instanceof MoveManualMetadata) {
            $metadata = (new MoveManualMetadata())->setMove($move);
            $this->entityManager->persist($metadata);
        }

        $metadata
            ->setWhiffOnCrouch($whiffOnCrouch)
            ->setForcesStanding($forcesStanding)
            ->setEditedBy($actor);

        return $metadata;
    }
}
