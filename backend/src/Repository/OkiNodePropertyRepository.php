<?php declare(strict_types=1);
namespace App\Repository;
use App\Entity\OkiNodeProperty;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
/** @extends ServiceEntityRepository<OkiNodeProperty> */
class OkiNodePropertyRepository extends ServiceEntityRepository { public function __construct(ManagerRegistry $registry) { parent::__construct($registry, OkiNodeProperty::class); } }
