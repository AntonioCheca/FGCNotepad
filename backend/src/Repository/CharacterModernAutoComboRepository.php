<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\Character;
use App\Entity\CharacterModernAutoCombo;
use App\Util\Enum\ModernAutoComboStrength;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CharacterModernAutoCombo>
 */
class CharacterModernAutoComboRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CharacterModernAutoCombo::class);
    }

    /** @return list<CharacterModernAutoCombo> */
    public function findByCharacter(Character $character): array
    {
        return $this->createQueryBuilder('autoCombo')
            ->addSelect('combo', 'step', 'child', 'move')
            ->innerJoin('autoCombo.combo', 'combo')
            ->leftJoin('combo.steps', 'step')
            ->leftJoin('step.child_sequence', 'child')
            ->leftJoin('child.move', 'move')
            ->andWhere('autoCombo.character = :character')
            ->setParameter('character', $character)
            ->getQuery()
            ->getResult();
    }

    public function findOneByCharacterAndStrength(Character $character, ModernAutoComboStrength $strength): ?CharacterModernAutoCombo
    {
        return $this->findOneBy(['character' => $character, 'strength' => $strength]);
    }
}
