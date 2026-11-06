<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * One anonymous thumbs-up on a research article. Articles are Markdown files in the frontend, so the slug is plain
 * text rather than a foreign key. Nothing about the visitor is stored.
 */
#[ORM\Table(name: 'research_article_like', schema: 'sf6')]
#[ORM\Index(name: 'idx_research_article_like_slug', columns: ['article_slug'])]
#[ORM\Entity]
class ResearchArticleLike
{
    public const SLUG_MAX_LENGTH = 120;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'article_slug', type: Types::STRING, length: self::SLUG_MAX_LENGTH)]
    private string $articleSlug;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct(string $articleSlug, \DateTimeImmutable $createdAt)
    {
        $this->articleSlug = $articleSlug;
        $this->createdAt = $createdAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getArticleSlug(): string
    {
        return $this->articleSlug;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
