<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\NotationTranslationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * One rewrite rule from replay-export notation to catalogue notation. Rules are data, loaded from an external CSV;
 * a null character applies the rule to every character. A rule with a condition only applies while the combo is in
 * that state (an active install, or a defender status on the hit), and its rewrites are tried before the plain notation.
 */
#[ORM\Entity(repositoryClass: NotationTranslationRepository::class)]
#[ORM\Table(name: 'notation_translation', schema: 'sf6')]
#[ORM\Index(name: 'idx_notation_translation_character', columns: ['character_id'])]
class NotationTranslation
{
    public const KIND_EXACT = 'exact';
    public const KIND_REGEX = 'regex';
    public const CONDITION_INSTALL = 'install';
    public const CONDITION_DEFENDER_STATUS = 'defender_status';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'character_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?Character $character;

    #[ORM\Column(name: 'match_kind', type: Types::STRING, length: 16)]
    private string $matchKind;

    #[ORM\Column(name: 'source_pattern', type: Types::STRING, length: 255)]
    private string $sourcePattern;

    #[ORM\Column(name: 'replacement', type: Types::STRING, length: 255)]
    private string $replacement;

    #[ORM\Column(name: 'priority', type: Types::INTEGER, options: ['default' => 0])]
    private int $priority;

    #[ORM\Column(name: 'condition_kind', type: Types::STRING, length: 16, nullable: true)]
    private ?string $conditionKind = null;

    #[ORM\Column(name: 'condition_value', type: Types::STRING, length: 64, nullable: true)]
    private ?string $conditionValue = null;

    #[ORM\Column(name: 'note', type: Types::TEXT, nullable: true)]
    private ?string $note;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct(?Character $character, string $matchKind, string $sourcePattern, string $replacement, int $priority, ?string $note)
    {
        $this->character = $character;
        $this->matchKind = $matchKind;
        $this->sourcePattern = $sourcePattern;
        $this->replacement = $replacement;
        $this->priority = $priority;
        $this->note = $note;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getCharacter(): ?Character { return $this->character; }
    public function getMatchKind(): string { return $this->matchKind; }
    public function getSourcePattern(): string { return $this->sourcePattern; }
    public function getReplacement(): string { return $this->replacement; }
    public function getPriority(): int { return $this->priority; }
    public function getNote(): ?string { return $this->note; }
    public function getConditionKind(): ?string { return $this->conditionKind; }
    public function getConditionValue(): ?string { return $this->conditionValue; }

    public function setCondition(?string $kind, ?string $value): static
    {
        $this->conditionKind = $kind;
        $this->conditionValue = $value;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
