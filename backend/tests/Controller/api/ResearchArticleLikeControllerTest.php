<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Tests\DatabaseTestCase;
use Symfony\Component\HttpFoundation\Response;

final class ResearchArticleLikeControllerTest extends DatabaseTestCase
{
    private const URI = '/api/research/juri-vs-ken-stats-across-ranks/likes';

    public function testEveryLikeAddsOneToTheArticleCount(): void
    {
        self::assertSame(['count' => 0], $this->call('GET', self::URI, '203.0.113.1'));
        self::assertSame(['count' => 1], $this->call('POST', self::URI, '203.0.113.1'));
        self::assertSame(['count' => 2], $this->call('POST', self::URI, '203.0.113.2'));
        self::assertSame(['count' => 2], $this->call('GET', self::URI, '203.0.113.3'));
        self::assertSame(['count' => 0], $this->call('GET', '/api/research/juri-ken-combo-optimization/likes', '203.0.113.1'));
    }

    public function testStoresNothingAboutTheVisitor(): void
    {
        $this->call('POST', self::URI, '203.0.113.1');

        $row = $this->entityManager->getConnection()->fetchAssociative('SELECT * FROM sf6.research_article_like');
        self::assertSame(['id', 'article_slug', 'created_at'], array_keys((array) $row));
        self::assertStringNotContainsString('203.0.113.1', implode(' ', (array) $row));
    }

    public function testRejectsSlugsThatCannotNameAnArticle(): void
    {
        foreach (['Juri_Ken', '-leading-hyphen', 'double--hyphen', str_repeat('a', 121)] as $slug) {
            $this->client->request('POST', sprintf('/api/research/%s/likes', $slug), server: ['REMOTE_ADDR' => '203.0.113.1']);
            self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode(), $slug);
        }

        self::assertSame(0, (int) $this->entityManager->getConnection()->fetchOne('SELECT COUNT(*) FROM sf6.research_article_like'));
    }

    public function testLikesAreRateLimitedPerIp(): void
    {
        for ($click = 0; $click < 20; ++$click) {
            $this->call('POST', self::URI, '203.0.113.1');
        }

        $this->client->request('POST', self::URI, server: ['REMOTE_ADDR' => '203.0.113.1']);
        self::assertSame(Response::HTTP_TOO_MANY_REQUESTS, $this->client->getResponse()->getStatusCode());
        self::assertTrue($this->client->getResponse()->headers->has('Retry-After'));

        self::assertSame(['count' => 20], $this->call('GET', self::URI, '203.0.113.1'), 'reads are not limited by likes');
        self::assertSame(['count' => 21], $this->call('POST', self::URI, '203.0.113.2'), 'other IPs keep their own budget');
    }

    /**
     * @return array{count: int}
     */
    private function call(string $method, string $uri, string $clientIp): array
    {
        $this->client->request($method, $uri, server: ['REMOTE_ADDR' => $clientIp]);
        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_OK, $response->getStatusCode(), sprintf('%s %s: %s', $method, $uri, (string) $response->getContent()));

        return json_decode((string) $response->getContent(), true);
    }
}
