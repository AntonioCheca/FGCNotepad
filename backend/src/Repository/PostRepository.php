<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\Post;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Post>
 */
class PostRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Post::class);
    }

    public function findPaginated(int $page, int $limit, string $query = ''): array
    {
        $qb = $this->createQueryBuilder('p')
            ->orderBy('p.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        if (!empty($query)) {
            $qb->andWhere('p.title LIKE :query')
                ->setParameter('query', '%' . $query . '%');
        }

        $queryObj = $qb->getQuery();

        return [
            'posts' => $queryObj->getResult(),
            'total' => $this->count([]),
        ];
    }
}
