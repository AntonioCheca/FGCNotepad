<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: 'scenario_combo_context', schema: 'sf6')]
#[ORM\Entity]
class ScenarioComboContext
{
    public const POSITION_VIEWER_DEFAULT_MIDSCREEN = 'viewer_default_midscreen';
    public const POSITION_CORNER = 'corner';
    public const POSITION_MIDSCREEN = 'midscreen';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'comboContext')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Scenario $scenario = null;

    #[ORM\Column(name: 'position_lock', type: Types::STRING, length: 32)]
    private string $positionLock = self::POSITION_VIEWER_DEFAULT_MIDSCREEN;

    /**
     * @var Collection<int, CharacterObjectState>
     */
    #[ORM\ManyToMany(targetEntity: CharacterObjectState::class, cascade: ['persist', 'remove'])]
    #[ORM\JoinTable(
        name: 'sf6.scenario_character_object_state',
        joinColumns: [new ORM\JoinColumn(name: 'scenario_context_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'character_object_state_id', referencedColumnName: 'id', unique: true, nullable: false, onDelete: 'CASCADE')]
    )]
    private Collection $characterStatuses;

    public function __construct()
    {
        $this->characterStatuses = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getScenario(): ?Scenario
    {
        return $this->scenario;
    }

    public function setScenario(?Scenario $scenario): static
    {
        $this->scenario = $scenario;

        return $this;
    }

    public function getPositionLock(): string
    {
        return $this->positionLock;
    }

    public function setPositionLock(string $positionLock): static
    {
        $this->positionLock = in_array($positionLock, self::validPositionLocks(), true)
            ? $positionLock
            : self::POSITION_VIEWER_DEFAULT_MIDSCREEN;

        return $this;
    }

    /**
     * @return list<string>
     */
    public static function validPositionLocks(): array
    {
        return [
            self::POSITION_VIEWER_DEFAULT_MIDSCREEN,
            self::POSITION_CORNER,
            self::POSITION_MIDSCREEN,
        ];
    }

    /**
     * @return Collection<int, CharacterObjectState>
     */
    public function getCharacterStatuses(): Collection
    {
        return $this->characterStatuses;
    }

    public function addCharacterStatus(CharacterObjectState $status): static
    {
        if (!$this->characterStatuses->contains($status)) {
            $this->characterStatuses->add($status);
        }

        return $this;
    }

    public function clearCharacterStatuses(): static
    {
        $this->characterStatuses->clear();

        return $this;
    }
}
