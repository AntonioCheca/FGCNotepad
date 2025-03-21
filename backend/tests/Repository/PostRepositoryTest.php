<?php declare(strict_types=1);

namespace App\Tests\Repository;

use App\Entity\Post;
use App\Repository\PostRepository;
use App\Tests\DatabaseTestCase;
use PHPUnit\Framework\TestCase;

class PostRepositoryTest extends DatabaseTestCase
{
    private PostRepository $postRepository;

    protected function setUp(): void
    {
        parent::setUp();

        /** @var PostRepository postRepository */
        $this->postRepository = $this->entityManager->getRepository(Post::class);
    }

    public function testFindPaginatedBasic()
    {
        $expectedSql = <<< SQL
        SELECT fp.id as id, fu.username as author, fp.title as title, ARRAY_AGG(tagg.name) as tags
        FROM forum.post fp
        LEFT JOIN forum.post_tag fpt ON fp.id = fpt.post_id
        LEFT JOIN forum.tag tagg ON fpt.tag_id = tagg.id
        LEFT JOIN forum.user fu ON fp.author_id = fu.id
        WHERE 1 = 1 GROUP BY fp.id, fu.username, fp.title, fp.created_at ORDER BY fp.created_at DESC LIMIT :limit OFFSET :offset
        SQL;

        self::assertEquals($expectedSql, $this->postRepository->getSqlAndElementsForPreparedStatement('', [], [], 10, 50)[1]);
    }
}
