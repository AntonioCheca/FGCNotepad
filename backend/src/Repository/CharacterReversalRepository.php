<?php declare(strict_types=1);
namespace App\Repository;
use App\Entity\CharacterReversal;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
/** @extends ServiceEntityRepository<CharacterReversal> */
class CharacterReversalRepository extends ServiceEntityRepository { public function __construct(ManagerRegistry $registry) { parent::__construct($registry, CharacterReversal::class); } }
