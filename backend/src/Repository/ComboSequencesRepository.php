<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\ComboSequences;
use App\Entity\Step;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ComboSequences>
 */
class ComboSequencesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ComboSequences::class);
    }

    public function findAllLeafs(): array
    {
        $qb = $this->createQueryBuilder('cs')
            ->innerJoin('cs.type', 'cst')
            ->addSelect('cst')
            ->where('cst.name = :typeName')
            ->setParameter('typeName', 'leaf')
            ->orderBy('cs.id', 'ASC');

        return $qb->getQuery()->getResult();
    }

    public function findAllNonLeafs(): array
    {
        $qb = $this->createQueryBuilder('cs')
            ->innerJoin('cs.type', 'cst')
            ->addSelect('cst')
            ->where('cst.name != :typeName')
            ->andWhere('cs.moderationState = :approvedState')
            ->setParameter('typeName', 'leaf')
            ->setParameter('approvedState', 'approved')
            ->orderBy('cs.id', 'ASC');

        return $qb->getQuery()->getResult();
    }

    /**
     * @param array{
     *     q?: string|null,
     *     characterId?: string|null,
     *     firstMoveId?: string|null,
     *     seasonId?: int|null,
     *     minDamage?: int|null,
     *     maxDamage?: int|null,
     *     minDifficulty?: int|null,
     *     maxDifficulty?: int|null,
     *     counterHitRequired?: bool|null,
     *     punishCounterRequired?: bool|null,
     *     cornerRequired?: bool|null,
     *     airborneRequired?: bool|null,
     *     midScreenRequired?: bool|null,
     *     notCrouchingRequired?: bool|null,
     *     isEssential?: bool|null,
     *     moveTypes?: list<string>
     * } $filters
     *
     * @return list<ComboSequences>
     */
    public function searchNonLeafsByFilters(array $filters, int $limit = 100): array
    {
        $safeLimit = max(1, min($limit, 300));

        $qb = $this->createQueryBuilder('combo')
            ->leftJoin('combo.type', 'comboType')
            ->leftJoin('combo.comboMetrics', 'metrics')
            ->leftJoin('combo.comboRequirement', 'requirement')
            ->addSelect('comboType', 'metrics', 'requirement')
            ->andWhere('comboType.name != :leafType')
            ->andWhere('combo.moderationState = :approvedState')
            ->setParameter('leafType', 'leaf')
            ->setParameter('approvedState', 'approved')
            ->orderBy('combo.id', 'ASC')
            ->setMaxResults($safeLimit)
            ->distinct();

        $query = isset($filters['q']) && is_string($filters['q']) ? trim($filters['q']) : '';
        if ('' !== $query) {
            $qb->andWhere('LOWER(combo.name) LIKE :query')
                ->setParameter('query', '%' . mb_strtolower($query) . '%');
        }

        $characterId = isset($filters['characterId']) && is_string($filters['characterId']) ? trim($filters['characterId']) : '';
        $firstMoveId = isset($filters['firstMoveId']) && is_string($filters['firstMoveId']) ? trim($filters['firstMoveId']) : '';
        if ('' !== $characterId || '' !== $firstMoveId) {
            $qb->innerJoin('combo.steps', 'starterStep')
                ->innerJoin('starterStep.child_sequence', 'starterSequence')
                ->innerJoin('starterSequence.move', 'starterMove')
                ->andWhere('starterStep.ordinal_in_combo = 1');

            if ('' !== $characterId) {
                $qb->innerJoin('starterMove.character', 'starterCharacter')
                    ->andWhere('starterCharacter.id = :characterId')
                    ->setParameter('characterId', $characterId);
            }

            if ('' !== $firstMoveId) {
                $qb->andWhere('starterMove.id = :firstMoveId')
                    ->setParameter('firstMoveId', $firstMoveId);
            }
        }

        $seasonId = isset($filters['seasonId']) && is_int($filters['seasonId']) ? $filters['seasonId'] : null;
        if (null !== $seasonId) {
            $qb->innerJoin('combo.season', 'season')
                ->andWhere('season.id = :seasonId')
                ->setParameter('seasonId', $seasonId);
        }

        $minDamage = isset($filters['minDamage']) && is_int($filters['minDamage']) ? $filters['minDamage'] : null;
        if (null !== $minDamage) {
            $qb->andWhere('metrics.damage >= :minDamage')
                ->setParameter('minDamage', $minDamage);
        }

        $maxDamage = isset($filters['maxDamage']) && is_int($filters['maxDamage']) ? $filters['maxDamage'] : null;
        if (null !== $maxDamage) {
            $qb->andWhere('metrics.damage <= :maxDamage')
                ->setParameter('maxDamage', $maxDamage);
        }

        $minDifficulty = isset($filters['minDifficulty']) && is_int($filters['minDifficulty']) ? $filters['minDifficulty'] : null;
        if (null !== $minDifficulty) {
            $qb->andWhere('metrics.difficultyLevel >= :minDifficulty')
                ->setParameter('minDifficulty', $minDifficulty);
        }

        $maxDifficulty = isset($filters['maxDifficulty']) && is_int($filters['maxDifficulty']) ? $filters['maxDifficulty'] : null;
        if (null !== $maxDifficulty) {
            $qb->andWhere('metrics.difficultyLevel <= :maxDifficulty')
                ->setParameter('maxDifficulty', $maxDifficulty);
        }

        $booleanRequirementFilters = [
            'counterHitRequired' => 'requirement.counter_hit_required',
            'punishCounterRequired' => 'requirement.punish_counter_required',
            'cornerRequired' => 'requirement.corner_required',
            'airborneRequired' => 'requirement.airborne_required',
            'midScreenRequired' => 'requirement.mid_screen_required',
            'notCrouchingRequired' => 'requirement.not_crouching_required',
        ];

        foreach ($booleanRequirementFilters as $filterKey => $columnName) {
            if (!array_key_exists($filterKey, $filters) || !is_bool($filters[$filterKey])) {
                continue;
            }

            $parameterName = sprintf('%sValue', $filterKey);
            $qb->andWhere(sprintf('%s = :%s', $columnName, $parameterName))
                ->setParameter($parameterName, $filters[$filterKey]);
        }

        if (array_key_exists('isEssential', $filters) && is_bool($filters['isEssential'])) {
            $qb->andWhere('combo.isEssential = :isEssential')
                ->setParameter('isEssential', $filters['isEssential']);
        }

        $moveTypes = isset($filters['moveTypes']) && is_array($filters['moveTypes']) ? array_values($filters['moveTypes']) : [];
        if ([] !== $moveTypes) {
            $moveTypeSubQuery = $this->getEntityManager()->createQueryBuilder()
                ->select('1')
                ->from(Step::class, 'moveTypeStep')
                ->innerJoin('moveTypeStep.child_sequence', 'moveTypeSequence')
                ->innerJoin('moveTypeSequence.move', 'moveTypeMove')
                ->innerJoin('moveTypeMove.frameData', 'moveTypeFrameData')
                ->where('moveTypeStep.parent_sequence = combo')
                ->andWhere('moveTypeFrameData.moveType IN (:moveTypes)')
                ->getDQL();

            $qb->andWhere($qb->expr()->exists($moveTypeSubQuery))
                ->setParameter('moveTypes', $moveTypes);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * @return array<int, array{id: int, name: string, character_id: string, character_name: string}>
     */
    public function findLeafSummariesByCharacterId(string $characterId): array
    {
        $qb = $this->createQueryBuilder('cs')
            ->select('cs.id AS id', 'cs.name AS name', 'c.id AS character_id', 'c.name AS character_name')
            ->innerJoin('cs.type', 'cst')
            ->innerJoin('cs.move', 'm')
            ->innerJoin('m.character', 'c')
            ->where('cst.name = :typeName')
            ->andWhere('c.id = :characterId')
            ->setParameter('typeName', 'leaf')
            ->setParameter('characterId', $characterId)
            ->orderBy('cs.id', 'ASC');

        return $qb->getQuery()->getArrayResult();
    }

    /**
     * @return ComboSequences[]
     */
    public function findLeafsByCharacterId(string $characterId): array
    {
        $qb = $this->createQueryBuilder('cs')
            ->innerJoin('cs.type', 'cst')
            ->innerJoin('cs.move', 'm')
            ->innerJoin('m.character', 'c')
            ->leftJoin('m.frameData', 'fd')
            ->addSelect('cst', 'm', 'c', 'fd')
            ->where('cst.name = :typeName')
            ->andWhere('c.id = :characterId')
            ->setParameter('typeName', 'leaf')
            ->setParameter('characterId', $characterId)
            ->orderBy('cs.id', 'ASC');

        return $qb->getQuery()->getResult();
    }

    /**
     * @param list<string> $starterMoveIds
     *
     * @return array{combo_id:int,resolved_damage:int,starter_move_id:string}|null
     */
    public function findBestDynamicComboMatch(string $attackerCharacterId, array $starterMoveIds, string $hitType): ?array
    {
        if ([] === $starterMoveIds) {
            return null;
        }

        $qb = $this->createQueryBuilder('combo')
            ->select(
                'combo.id AS combo_id',
                'metrics.damage AS resolved_damage',
                'starterMove.id AS starter_move_id'
            )
            ->innerJoin('combo.type', 'comboType')
            ->innerJoin('combo.comboMetrics', 'metrics')
            ->innerJoin('combo.steps', 'starterStep')
            ->innerJoin('starterStep.child_sequence', 'starterSequence')
            ->innerJoin('starterSequence.move', 'starterMove')
            ->innerJoin('starterMove.character', 'attackerCharacter')
            ->leftJoin('combo.comboRequirement', 'comboRequirement')
            ->where('comboType.name = :comboTypeName')
            ->andWhere('combo.moderationState = :approvedState')
            ->andWhere('attackerCharacter.id = :attackerCharacterId')
            ->andWhere('starterMove.id IN (:starterMoveIds)')
            ->andWhere('starterStep.ordinal_in_combo = 1')
            ->setParameter('comboTypeName', 'combo')
            ->setParameter('approvedState', 'approved')
            ->setParameter('attackerCharacterId', $attackerCharacterId)
            ->setParameter('starterMoveIds', $starterMoveIds)
            ->orderBy('metrics.damage', 'DESC')
            ->addOrderBy('combo.id', 'ASC')
            ->setMaxResults(1);

        return $this->finalizeBestDynamicComboQuery($qb, $hitType, null, null, false);
    }

    /**
     * @param list<string> $starterMoveIds
     * @param list<int>|null $allowedComboIds
     *
     * @return array{combo_id:int,resolved_damage:int,starter_move_id:string}|null
     */
    public function findBestDynamicComboMatchWithExecutionFilter(
        string $attackerCharacterId,
        array $starterMoveIds,
        string $hitType,
        ?array $allowedComboIds,
        ?int $maxDifficulty,
        bool $includeUnratedDifficulty
    ): ?array {
        if ([] === $starterMoveIds) {
            return null;
        }

        if (is_array($allowedComboIds) && [] === $allowedComboIds) {
            return null;
        }

        $qb = $this->createQueryBuilder('combo')
            ->select(
                'combo.id AS combo_id',
                'metrics.damage AS resolved_damage',
                'starterMove.id AS starter_move_id'
            )
            ->innerJoin('combo.type', 'comboType')
            ->innerJoin('combo.comboMetrics', 'metrics')
            ->innerJoin('combo.steps', 'starterStep')
            ->innerJoin('starterStep.child_sequence', 'starterSequence')
            ->innerJoin('starterSequence.move', 'starterMove')
            ->innerJoin('starterMove.character', 'attackerCharacter')
            ->leftJoin('combo.comboRequirement', 'comboRequirement')
            ->where('comboType.name = :comboTypeName')
            ->andWhere('combo.moderationState = :approvedState')
            ->andWhere('attackerCharacter.id = :attackerCharacterId')
            ->andWhere('starterMove.id IN (:starterMoveIds)')
            ->andWhere('starterStep.ordinal_in_combo = 1')
            ->setParameter('comboTypeName', 'combo')
            ->setParameter('approvedState', 'approved')
            ->setParameter('attackerCharacterId', $attackerCharacterId)
            ->setParameter('starterMoveIds', $starterMoveIds)
            ->orderBy('metrics.damage', 'DESC')
            ->addOrderBy('combo.id', 'ASC')
            ->setMaxResults(1);

        return $this->finalizeBestDynamicComboQuery(
            $qb,
            $hitType,
            $allowedComboIds,
            $maxDifficulty,
            $includeUnratedDifficulty
        );
    }

    /**
     * @return list<array{id:int,name:string,difficultyLevel:int|null,damage:int|null}>
     */
    public function findComboKnowledgeRowsByCharacterId(string $characterId): array
    {
        $rows = $this->createQueryBuilder('combo')
            ->select(
                'combo.id AS id',
                'combo.name AS name',
                'metrics.difficultyLevel AS difficulty_level',
                'metrics.damage AS damage'
            )
            ->innerJoin('combo.type', 'comboType')
            ->innerJoin('combo.steps', 'starterStep')
            ->innerJoin('starterStep.child_sequence', 'starterSequence')
            ->innerJoin('starterSequence.move', 'starterMove')
            ->innerJoin('starterMove.character', 'character')
            ->leftJoin('combo.comboMetrics', 'metrics')
            ->andWhere('comboType.name = :comboTypeName')
            ->andWhere('combo.moderationState = :approvedState')
            ->andWhere('starterStep.ordinal_in_combo = 1')
            ->andWhere('character.id = :characterId')
            ->setParameter('comboTypeName', 'combo')
            ->setParameter('approvedState', 'approved')
            ->setParameter('characterId', $characterId)
            ->orderBy('metrics.difficultyLevel', 'ASC')
            ->addOrderBy('combo.name', 'ASC')
            ->getQuery()
            ->getArrayResult();

        return array_values(array_map(
            static fn (array $row): array => [
                'id' => (int) $row['id'],
                'name' => (string) $row['name'],
                'difficultyLevel' => null !== $row['difficulty_level'] ? (int) $row['difficulty_level'] : null,
                'damage' => null !== $row['damage'] ? (int) $row['damage'] : null,
            ],
            $rows
        ));
    }

    /**
     * @return list<array{id:string,name:string}>
     */
    public function findCharacterSummariesWithCombos(): array
    {
        $rows = $this->createQueryBuilder('combo')
            ->select('DISTINCT character.id AS id', 'character.name AS name')
            ->innerJoin('combo.type', 'comboType')
            ->innerJoin('combo.steps', 'starterStep')
            ->innerJoin('starterStep.child_sequence', 'starterSequence')
            ->innerJoin('starterSequence.move', 'starterMove')
            ->innerJoin('starterMove.character', 'character')
            ->andWhere('comboType.name = :comboTypeName')
            ->andWhere('combo.moderationState = :approvedState')
            ->andWhere('starterStep.ordinal_in_combo = 1')
            ->setParameter('comboTypeName', 'combo')
            ->setParameter('approvedState', 'approved')
            ->orderBy('character.name', 'ASC')
            ->getQuery()
            ->getArrayResult();

        return array_values(array_map(
            static fn (array $row): array => [
                'id' => (string) $row['id'],
                'name' => (string) $row['name'],
            ],
            $rows
        ));
    }

    /**
     * @param list<int> $excludedComboIds
     *
     * @return list<array{id:int,name:string,difficultyLevel:int|null}>
     */
    public function findEssentialCandidateRowsByCharacterAndDifficulty(
        string $characterId,
        int $difficultyCap,
        array $excludedComboIds = []
    ): array {
        $qb = $this->createQueryBuilder('combo')
            ->select(
                'combo.id AS id',
                'combo.name AS name',
                'metrics.difficultyLevel AS difficulty_level'
            )
            ->innerJoin('combo.type', 'comboType')
            ->innerJoin('combo.steps', 'starterStep')
            ->innerJoin('starterStep.child_sequence', 'starterSequence')
            ->innerJoin('starterSequence.move', 'starterMove')
            ->innerJoin('starterMove.character', 'character')
            ->leftJoin('combo.comboMetrics', 'metrics')
            ->andWhere('comboType.name = :comboTypeName')
            ->andWhere('combo.moderationState = :approvedState')
            ->andWhere('starterStep.ordinal_in_combo = 1')
            ->andWhere('character.id = :characterId')
            ->andWhere('combo.isEssential = true')
            ->andWhere('metrics.difficultyLevel <= :difficultyCap')
            ->setParameter('comboTypeName', 'combo')
            ->setParameter('approvedState', 'approved')
            ->setParameter('characterId', $characterId)
            ->setParameter('difficultyCap', $difficultyCap)
            ->orderBy('metrics.difficultyLevel', 'ASC')
            ->addOrderBy('combo.name', 'ASC');

        if ([] !== $excludedComboIds) {
            $qb->andWhere('combo.id NOT IN (:excludedComboIds)')
                ->setParameter('excludedComboIds', $excludedComboIds);
        }

        $rows = $qb->getQuery()->getArrayResult();

        return array_values(array_map(
            static fn (array $row): array => [
                'id' => (int) $row['id'],
                'name' => (string) $row['name'],
                'difficultyLevel' => null !== $row['difficulty_level'] ? (int) $row['difficulty_level'] : null,
            ],
            $rows
        ));
    }

    /**
     * @param list<int>|null $allowedComboIds
     *
     * @return array{combo_id:int,resolved_damage:int,starter_move_id:string}|null
     */
    private function finalizeBestDynamicComboQuery(
        \Doctrine\ORM\QueryBuilder $qb,
        string $hitType,
        ?array $allowedComboIds,
        ?int $maxDifficulty,
        bool $includeUnratedDifficulty
    ): ?array {
        if (null !== $allowedComboIds) {
            $qb->andWhere('combo.id IN (:allowedComboIds)')
                ->setParameter('allowedComboIds', $allowedComboIds);
        }

        if (null !== $maxDifficulty) {
            if ($includeUnratedDifficulty) {
                $qb->andWhere('(metrics.difficultyLevel <= :maxDifficulty OR metrics.difficultyLevel IS NULL)');
            } else {
                $qb->andWhere('metrics.difficultyLevel <= :maxDifficulty');
            }

            $qb->setParameter('maxDifficulty', $maxDifficulty);
        }

        if ('normal' === $hitType) {
            $qb->andWhere(
                '(comboRequirement.id IS NULL) OR '
                . '(comboRequirement.counter_hit_required = false AND comboRequirement.punish_counter_required = false)'
            );
        } elseif ('counter_hit' === $hitType) {
            $qb->andWhere('(comboRequirement.id IS NULL) OR (comboRequirement.punish_counter_required = false)');
        }

        $result = $qb->getQuery()->getOneOrNullResult();
        if (!is_array($result)) {
            return null;
        }

        return [
            'combo_id' => (int) $result['combo_id'],
            'resolved_damage' => (int) $result['resolved_damage'],
            'starter_move_id' => (string) $result['starter_move_id'],
        ];
    }
}
