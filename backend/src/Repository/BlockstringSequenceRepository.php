<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\BlockstringSequence;
use App\Entity\User;
use App\Util\Enum\ModerationState;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<BlockstringSequence> */
class BlockstringSequenceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BlockstringSequence::class);
    }

    /**
     * @param array<string, mixed> $filters
     * @return list<BlockstringSequence>
     */
    public function search(array $filters, int $limit = 100, ?User $visibleAuthor = null): array
    {
        $qb = $this->createQueryBuilder('sequence')
            ->leftJoin('sequence.attackerCharacter', 'attacker')
            ->leftJoin('sequence.steps', 'step')
            ->leftJoin('step.move', 'move')
            ->leftJoin('move.character', 'moveCharacter')
            ->leftJoin('sequence.routes', 'route')
            ->leftJoin('route.steps', 'routeStep')
            ->leftJoin('routeStep.move', 'routeStepMove')
            ->leftJoin('routeStepMove.character', 'routeStepMoveCharacter')
            ->leftJoin('route.connections', 'routeConnection')
            ->leftJoin('routeConnection.gap', 'routeConnectionGap')
            ->leftJoin('sequence.gaps', 'gap')
            ->leftJoin('sequence.defenseEntries', 'defenseEntry')
            ->leftJoin('defenseEntry.gap', 'defenseGap')
            ->leftJoin('defenseEntry.defenderCharacter', 'defender')
            ->leftJoin('defenseEntry.move', 'defenseMove')
            ->addSelect('attacker', 'step', 'move', 'moveCharacter', 'route', 'routeStep', 'routeStepMove', 'routeStepMoveCharacter', 'routeConnection', 'routeConnectionGap', 'gap', 'defenseEntry', 'defenseGap', 'defender', 'defenseMove')
            ->distinct()
            ->setMaxResults(max(1, min($limit, 200)))
            ->orderBy('sequence.id', 'DESC');

        if ($visibleAuthor instanceof User) {
            $qb->andWhere('(sequence.moderationState = :approvedState OR sequence.author = :visibleAuthor)')
                ->setParameter('visibleAuthor', $visibleAuthor);
        } else {
            $qb->andWhere('sequence.moderationState = :approvedState');
        }
        $qb->setParameter('approvedState', ModerationState::APPROVED->value);

        $q = isset($filters['q']) && is_string($filters['q']) ? trim(mb_strtolower($filters['q'])) : '';
        if ('' !== $q) {
            $qb->andWhere('(LOWER(sequence.title) LIKE :q OR LOWER(sequence.summary) LIKE :q OR LOWER(move.numpadNotation) LIKE :q)')
                ->setParameter('q', '%' . $q . '%');
        }

        $attackerCharacterId = isset($filters['attackerCharacterId']) && is_string($filters['attackerCharacterId']) ? trim($filters['attackerCharacterId']) : '';
        if ('' !== $attackerCharacterId) {
            $qb->andWhere('attacker.id = :attackerCharacterId')
                ->setParameter('attackerCharacterId', $attackerCharacterId);
        }

        $defenderCharacterId = isset($filters['defenderCharacterId']) && is_string($filters['defenderCharacterId']) ? trim($filters['defenderCharacterId']) : '';
        if ('' !== $defenderCharacterId) {
            $qb->andWhere('(defender.id = :defenderCharacterId OR defenseEntry.defenderCharacter IS NULL)')
                ->setParameter('defenderCharacterId', $defenderCharacterId);
        }

        $moveId = isset($filters['moveId']) && is_string($filters['moveId']) ? trim($filters['moveId']) : '';
        if ('' !== $moveId) {
            $qb->andWhere('move.id = :moveId')
                ->setParameter('moveId', $moveId);
        }

        $classification = isset($filters['classification']) && is_string($filters['classification']) ? trim($filters['classification']) : '';
        if ('' !== $classification) {
            $qb->andWhere('sequence.classification = :classification')
                ->setParameter('classification', $classification);
        }

        return $qb->getQuery()->getResult();
    }

    public function findDetail(int $id, ?User $visibleAuthor = null): ?BlockstringSequence
    {
        $qb = $this->createQueryBuilder('sequence')
            ->leftJoin('sequence.author', 'author')
            ->leftJoin('sequence.attackerCharacter', 'attacker')
            ->leftJoin('sequence.steps', 'step')
            ->leftJoin('step.move', 'move')
            ->leftJoin('move.character', 'moveCharacter')
            ->leftJoin('sequence.routes', 'route')
            ->leftJoin('route.branchAnchorStep', 'routeBranchAnchorStep')
            ->leftJoin('route.branchAnchorConnection', 'routeBranchAnchorConnection')
            ->leftJoin('route.steps', 'routeStep')
            ->leftJoin('routeStep.move', 'routeStepMove')
            ->leftJoin('routeStepMove.character', 'routeStepMoveCharacter')
            ->leftJoin('route.connections', 'routeConnection')
            ->leftJoin('routeConnection.sourceStep', 'routeConnectionSourceStep')
            ->leftJoin('routeConnection.destinationStep', 'routeConnectionDestinationStep')
            ->leftJoin('routeConnection.gap', 'routeConnectionGap')
            ->leftJoin('sequence.gaps', 'gap')
            ->leftJoin('gap.step', 'gapStep')
            ->leftJoin('sequence.defenseEntries', 'defenseEntry')
            ->leftJoin('defenseEntry.gap', 'defenseGap')
            ->leftJoin('defenseGap.step', 'defenseGapStep')
            ->leftJoin('defenseEntry.defenderCharacter', 'defender')
            ->leftJoin('defenseEntry.move', 'answerMove')
            ->leftJoin('answerMove.character', 'answerMoveCharacter')
            ->leftJoin('sequence.conditions', 'condition')
            ->leftJoin('sequence.adaptations', 'adaptation')
            ->leftJoin('adaptation.gap', 'adaptationGap')
            ->leftJoin('adaptation.steps', 'adaptationStep')
            ->leftJoin('adaptationStep.move', 'adaptationMove')
            ->leftJoin('adaptationMove.character', 'adaptationMoveCharacter')
            ->leftJoin('adaptation.comboSearch', 'adaptationComboSearch')
            ->leftJoin('adaptationComboSearch.character', 'adaptationComboSearchCharacter')
            ->leftJoin('adaptationComboSearch.firstMove', 'adaptationComboSearchFirstMove')
            ->leftJoin('adaptationComboSearchFirstMove.character', 'adaptationComboSearchFirstMoveCharacter')
            ->leftJoin('adaptationComboSearch.enderMove', 'adaptationComboSearchEnderMove')
            ->leftJoin('adaptationComboSearchEnderMove.character', 'adaptationComboSearchEnderMoveCharacter')
            ->leftJoin('adaptationComboSearch.situation', 'adaptationComboSearchSituation')
            ->leftJoin('adaptationComboSearchSituation.type', 'adaptationComboSearchSituationType')
            ->leftJoin('adaptationComboSearch.spacing', 'adaptationComboSearchSpacing')
            ->addSelect('author', 'attacker', 'step', 'move', 'moveCharacter', 'route', 'routeBranchAnchorStep', 'routeBranchAnchorConnection', 'routeStep', 'routeStepMove', 'routeStepMoveCharacter', 'routeConnection', 'routeConnectionSourceStep', 'routeConnectionDestinationStep', 'routeConnectionGap', 'gap', 'gapStep', 'defenseEntry', 'defenseGap', 'defenseGapStep', 'defender', 'answerMove', 'answerMoveCharacter', 'condition', 'adaptation', 'adaptationGap', 'adaptationStep', 'adaptationMove', 'adaptationMoveCharacter', 'adaptationComboSearch', 'adaptationComboSearchCharacter', 'adaptationComboSearchFirstMove', 'adaptationComboSearchFirstMoveCharacter', 'adaptationComboSearchEnderMove', 'adaptationComboSearchEnderMoveCharacter', 'adaptationComboSearchSituation', 'adaptationComboSearchSituationType', 'adaptationComboSearchSpacing')
            ->andWhere('sequence.id = :id')
            ->setParameter('id', $id);

        if ($visibleAuthor instanceof User) {
            $qb->andWhere('(sequence.moderationState = :approvedState OR sequence.author = :visibleAuthor)')
                ->setParameter('visibleAuthor', $visibleAuthor);
        } else {
            $qb->andWhere('sequence.moderationState = :approvedState');
        }
        $qb->setParameter('approvedState', ModerationState::APPROVED->value);

        return $qb->getQuery()->getOneOrNullResult();
    }
}
