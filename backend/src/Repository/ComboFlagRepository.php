<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\ComboFlag;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ComboFlag>
 */
class ComboFlagRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ComboFlag::class);
    }
}
