<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ResearchArticleLike;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Anonymous article likes. Nothing identifies the visitor, so the page only locks the button until a reload; the
 * controller's rate limit keeps scripted clicking in check.
 */
class ResearchArticleLikeService
{
    private const SLUG_PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public static function isValidSlug(string $slug): bool
    {
        return strlen($slug) <= ResearchArticleLike::SLUG_MAX_LENGTH && 1 === preg_match(self::SLUG_PATTERN, $slug);
    }

    public function count(string $slug): int
    {
        return $this->entityManager->getRepository(ResearchArticleLike::class)->count(['articleSlug' => $slug]);
    }

    public function like(string $slug): int
    {
        $this->entityManager->persist(new ResearchArticleLike($slug, new \DateTimeImmutable()));
        $this->entityManager->flush();

        return $this->count($slug);
    }
}
