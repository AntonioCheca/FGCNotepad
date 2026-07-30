<?php declare(strict_types=1);
namespace App\Repository;
use App\Entity\OkiSetup;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
/** @extends ServiceEntityRepository<OkiSetup> */
class OkiSetupRepository extends ServiceEntityRepository { public function __construct(ManagerRegistry $registry) { parent::__construct($registry, OkiSetup::class); } }
