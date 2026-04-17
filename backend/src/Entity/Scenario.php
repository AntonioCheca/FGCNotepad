<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ScenarioRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Table(name: "scenario", schema: "sf6")]
#[ORM\Index(name: "idx_scenario_public_id", columns: ["public_id"])]
#[ORM\Index(name: "idx_scenario_search_label", columns: ["search_label"])]
#[ORM\Entity(repositoryClass: ScenarioRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Scenario
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'public_id', type: UuidType::NAME, unique: true)]
    private Uuid $publicId;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $name = null;

    #[ORM\Column(name: 'search_label', type: Types::TEXT)]
    private string $searchLabel = '';

    /**
     * Opaque scenario-table matrix payload persisted from lexical post body.
     *
     * Body cell shapes currently include:
     * - value/reference/computed cells
     * - dynamic_combo cells carrying:
     *   - dynamicCombo.attackerCharacterId
     *   - dynamicCombo.starterMoveIds (non-empty)
     *   - dynamicCombo.starterContext.isPunishCounter / isCounterHit
     */
    #[ORM\Column(type: Types::JSON, options: ['default' => '{}'])]
    private array $payload = [];

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'author_id', referencedColumnName: 'id', nullable: true)]
    private ?User $author = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?ScenarioType $type = null;

    /**
     * @var Collection<int, ScenarioLayer>
     */
    #[ORM\OneToMany(mappedBy: 'scenario', targetEntity: ScenarioLayer::class, cascade: ['persist'])]
    private Collection $layers;

    public function __construct()
    {
        $this->layers = new ArrayCollection();
        $this->publicId = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPublicId(): Uuid
    {
        return $this->publicId;
    }

    public function setPublicId(Uuid $publicId): static
    {
        $this->publicId = $publicId;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        $this->searchLabel = mb_strtolower(trim($name));

        return $this;
    }

    public function getSearchLabel(): string
    {
        return $this->searchLabel;
    }

    public function setSearchLabel(string $searchLabel): static
    {
        $this->searchLabel = mb_strtolower(trim($searchLabel));

        return $this;
    }

    public function getPayload(): array
    {
        return $this->payload;
    }

    public function setPayload(array $payload): static
    {
        $this->payload = $payload;

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

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

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

    public function getType(): ?ScenarioType
    {
        return $this->type;
    }

    public function setType(?ScenarioType $type): static
    {
        $this->type = $type;

        return $this;
    }

    /**
     * @return Collection<int, ScenarioLayer>
     */
    public function getLayers(): Collection
    {
        return $this->layers;
    }

    public function addLayer(ScenarioLayer $layer): static
    {
        if (!$this->layers->contains($layer)) {
            $this->layers->add($layer);
            $layer->setScenario($this);
        }

        return $this;
    }

    public function removeLayer(ScenarioLayer $layer): static
    {
        if ($this->layers->removeElement($layer)) {
            // set the owning side to null (unless already changed)
            if ($layer->getScenario() === $this) {
                $layer->setScenario(null);
            }
        }

        return $this;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        if (!isset($this->publicId)) {
            $this->publicId = Uuid::v7();
        }

        if (null === $this->name) {
            $this->name = '';
        }

        $this->searchLabel = mb_strtolower(trim($this->name));

        $now = new \DateTimeImmutable();
        $this->createdAt = $this->createdAt ?? $now;
        $this->updatedAt = $this->updatedAt ?? $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
        $this->searchLabel = mb_strtolower(trim((string) $this->name));
    }
}
