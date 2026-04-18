<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\ComboSequences;
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
            ->setParameter('typeName', 'leaf')
            ->orderBy('cs.id', 'ASC');

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
            ->andWhere('attackerCharacter.id = :attackerCharacterId')
            ->andWhere('starterMove.id IN (:starterMoveIds)')
            ->andWhere('starterStep.ordinal_in_combo = 1')
            ->setParameter('comboTypeName', 'combo')
            ->setParameter('attackerCharacterId', $attackerCharacterId)
            ->setParameter('starterMoveIds', $starterMoveIds)
            ->orderBy('metrics.damage', 'DESC')
            ->addOrderBy('combo.id', 'ASC')
            ->setMaxResults(1);

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
