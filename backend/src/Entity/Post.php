<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\PostRepository;
use App\Util\Enum\ModerationState;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Table(name: 'post', schema: 'forum')]
#[ORM\Entity(repositoryClass: PostRepository::class)]
class Post
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[Assert\Length(min: 3, max: 255)]
    #[ORM\Column(type: Types::TEXT)]
    private string $title;

    #[ORM\Column(type: Types::TEXT)]
    private string $body;

    /**
     * @var Collection<int, Component>
     */
    #[ORM\ManyToMany(targetEntity: Component::class, inversedBy: "posts")]
    #[ORM\JoinTable(name: "post_components", schema: "forum")]
    #[ORM\JoinColumn(name: "post_id", referencedColumnName: "id", onDelete: "CASCADE")]
    #[ORM\InverseJoinColumn(name: "component_id", referencedColumnName: "id", onDelete: "CASCADE")]
    private Collection $components;

    #[ORM\ManyToOne(inversedBy: 'posts')]
    #[ORM\JoinColumn(name: "author_id", nullable: true)]
    private ?User $author = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $last_modified;

    #[ORM\Column(name: 'moderation_state', type: Types::STRING, length: 32)]
    private string $moderationState = ModerationState::APPROVED->value;

    #[ORM\Column(name: 'submitted_for_review_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $submittedForReviewAt = null;

    #[ORM\Column(name: 'moderation_decided_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $moderationDecidedAt = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'moderation_decided_by_id', referencedColumnName: 'id', nullable: true)]
    private ?User $moderationDecidedBy = null;

    #[ORM\Column(name: 'moderation_reason', type: Types::TEXT, nullable: true)]
    private ?string $moderationReason = null;

    /**
     * @var Collection<int, Tag>
     */
    #[ORM\ManyToMany(targetEntity: Tag::class, inversedBy: 'posts')]
    #[ORM\JoinTable(name: "post_tag", schema: "forum")]
    private Collection $tags;

    public function __construct()
    {
        $this->components = new ArrayCollection();
        $this->tags = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getBody(): string
    {
        return $this->body;
    }

    public function setBody(string $body): static
    {
        $this->body = $body;

        return $this;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getLastModified(): \DateTimeInterface
    {
        return $this->last_modified;
    }

    public function setLastModified(\DateTimeInterface $last_modified): static
    {
        $this->last_modified = $last_modified;

        return $this;
    }

    public function getModerationState(): string
    {
        return $this->moderationState;
    }

    public function setModerationState(string $moderationState): static
    {
        $this->moderationState = $moderationState;

        return $this;
    }

    public function getSubmittedForReviewAt(): ?\DateTimeImmutable
    {
        return $this->submittedForReviewAt;
    }

    public function setSubmittedForReviewAt(?\DateTimeImmutable $submittedForReviewAt): static
    {
        $this->submittedForReviewAt = $submittedForReviewAt;

        return $this;
    }

    public function getModerationDecidedAt(): ?\DateTimeImmutable
    {
        return $this->moderationDecidedAt;
    }

    public function setModerationDecidedAt(?\DateTimeImmutable $moderationDecidedAt): static
    {
        $this->moderationDecidedAt = $moderationDecidedAt;

        return $this;
    }

    public function getModerationDecidedBy(): ?User
    {
        return $this->moderationDecidedBy;
    }

    public function setModerationDecidedBy(?User $moderationDecidedBy): static
    {
        $this->moderationDecidedBy = $moderationDecidedBy;

        return $this;
    }

    public function getModerationReason(): ?string
    {
        return $this->moderationReason;
    }

    public function setModerationReason(?string $moderationReason): static
    {
        $this->moderationReason = $moderationReason;

        return $this;
    }

    /**
     * @return Collection<int, Component>
     */
    public function getComponents(): Collection
    {
        return $this->components;
    }

    public function addComponent(Component $component): self
    {
        if (!$this->components->contains($component)) {
            $this->components->add($component);
            $component->addPost($this);
        }
        return $this;
    }

    public function removeComponent(Component $component): self
    {
        if ($this->components->removeElement($component)) {
            $component->removePost($this);
        }
        return $this;
    }

    /**
     * @return Collection<int, Tag>
     */
    public function getTags(): Collection
    {
        return $this->tags;
    }

    public function addTag(Tag $tag): static
    {
        if (!$this->tags->contains($tag)) {
            $this->tags->add($tag);
        }

        return $this;
    }

    public function removeTag(Tag $tag): static
    {
        $this->tags->removeElement($tag);

        return $this;
    }
}
