<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\Post;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Query\ResultSetMapping;
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

    /**
     * @param array<string> $excludedTags
     * @param array<string> $includedTags
     * @return array<string, list<array<string, mixed>>>
     */
    public function findPaginated(int $page, int $limit, string $query = '', array $includedTags = [], array $excludedTags = []): array
    {
        list($elementsForPreparedSql, $sql) = $this->getSqlAndElementsForPreparedStatement($query, $includedTags, $excludedTags, $limit, $page);

        $query = $this->getEntityManager()->getConnection()->prepare($sql);

        foreach ($elementsForPreparedSql as $key => $valueForPrepared) {
            $query->bindValue($key, $valueForPrepared);
        }

        $posts = $query->executeQuery()->fetchAllAssociative();

        foreach ($posts as &$post) {
            $post['tags'] = trim($post['tags'], '{}');
            $post['tags'] = explode(',', $post['tags']);
        }

        return ['posts' => $posts];
    }

    /**
     * @param array<string> $excludedTags
     * @param array<string> $includedTags
     * @return array<mixed>
     */
    public function getSqlAndElementsForPreparedStatement(string $query, array $includedTags, array $excludedTags, int $limit, int $page): array
    {
        $elementsForPreparedSql = [];
        $sql = <<< SQL
        SELECT fp.id as id, fu.username as author, fp.title as title, ARRAY_AGG(tagg.name) as tags
        FROM forum.post fp
        LEFT JOIN forum.post_tag fpt ON fp.id = fpt.post_id
        LEFT JOIN forum.tag tagg ON fpt.tag_id = tagg.id
        LEFT JOIN forum.user fu ON fp.author_id = fu.id
        WHERE 1 = 1
        AND fp.moderation_state = :approvedState
        SQL;
        $elementsForPreparedSql['approvedState'] = 'approved';

        // Add search condition for title if query is provided
        if ('' !== $query) {
            $sql .= ' AND fp.title LIKE :query';
            $elementsForPreparedSql['query'] = $query;
        }

        $sql .= ' GROUP BY fp.id, fu.username, fp.title, fp.created_at';
        $havingClause = "HAVING";

        $indexForIncludedTag = 0;
        foreach ($includedTags as $includedTag) {
            $sql .= " $havingClause :includedTag$indexForIncludedTag = ANY(ARRAY_AGG(tagg.name))";
            $elementsForPreparedSql["includedTag$indexForIncludedTag"] = $includedTag;
            $indexForIncludedTag++;
            $havingClause = 'AND';
        }

        $indexForExcludedTag = 0;
        foreach ($excludedTags as $excludedTag) {
            $sql .= " $havingClause :excludedTag$indexForExcludedTag != ALL(ARRAY_AGG(tagg.name))";
            $elementsForPreparedSql["excludedTag$indexForExcludedTag"] = $excludedTag;
            $indexForExcludedTag++;
            $havingClause = 'AND';
        }

        $sql .= ' ORDER BY fp.created_at DESC';

        $sql .= ' LIMIT :limit OFFSET :offset';
        $elementsForPreparedSql["limit"] = $limit;
        $elementsForPreparedSql["offset"] = ($page - 1) * $limit;
        return array($elementsForPreparedSql, $sql);
    }
}
