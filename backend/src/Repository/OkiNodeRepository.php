<?php declare(strict_types=1);
namespace App\Repository;
use App\Entity\OkiNode;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
/** @extends ServiceEntityRepository<OkiNode> */
class OkiNodeRepository extends ServiceEntityRepository { public function __construct(ManagerRegistry $registry) { parent::__construct($registry, OkiNode::class); } }
