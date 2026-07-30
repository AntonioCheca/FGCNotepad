<?php declare(strict_types=1);
namespace App\Repository;
use App\Entity\ReversalProperty;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
/** @extends ServiceEntityRepository<ReversalProperty> */
class ReversalPropertyRepository extends ServiceEntityRepository { public function __construct(ManagerRegistry $registry) { parent::__construct($registry, ReversalProperty::class); } }
