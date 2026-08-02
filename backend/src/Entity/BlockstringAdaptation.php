<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'blockstring_adaptation', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_adaptation_sequence', columns: ['sequence_id'])]
#[ORM\Index(name: 'idx_blockstring_adaptation_gap', columns: ['gap_id'])]
class BlockstringAdaptation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'adaptations')]
    #[ORM\JoinColumn(name: 'sequence_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringSequence $sequence = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'gap_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringGap $gap = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $explanation = null;

    #[ORM\Column(name: 'sort_order', type: Types::SMALLINT, options: ['default' => 1])]
    private int $sortOrder = 1;

    /** @var Collection<int, BlockstringAdaptationStep> */
    #[ORM\OneToMany(targetEntity: BlockstringAdaptationStep::class, mappedBy: 'adaptation', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['ordinal' => 'ASC', 'id' => 'ASC'])]
    private Collection $steps;

    #[ORM\OneToOne(mappedBy: 'adaptation', targetEntity: BlockstringAdaptationComboSearch::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private ?BlockstringAdaptationComboSearch $comboSearch = null;

    public function __construct()
    {
        $this->steps = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getSequence(): ?BlockstringSequence { return $this->sequence; }
    public function setSequence(?BlockstringSequence $sequence): self { $this->sequence = $sequence; return $this; }
    public function getGap(): ?BlockstringGap { return $this->gap; }
    public function setGap(?BlockstringGap $gap): self { $this->gap = $gap; return $this; }
    public function getExplanation(): ?string { return $this->explanation; }
    public function setExplanation(?string $explanation): self { $this->explanation = $explanation; return $this; }
    public function getSortOrder(): int { return $this->sortOrder; }
    public function setSortOrder(int $sortOrder): self { $this->sortOrder = $sortOrder; return $this; }
    /** @return Collection<int, BlockstringAdaptationStep> */ public function getSteps(): Collection { return $this->steps; }
    public function addStep(BlockstringAdaptationStep $step): self { if (!$this->steps->contains($step)) { $this->steps->add($step); $step->setAdaptation($this); } return $this; }
    public function getComboSearch(): ?BlockstringAdaptationComboSearch { return $this->comboSearch; }
    public function setComboSearch(?BlockstringAdaptationComboSearch $comboSearch): self { $this->comboSearch = $comboSearch; if ($comboSearch instanceof BlockstringAdaptationComboSearch && $comboSearch->getAdaptation() !== $this) { $comboSearch->setAdaptation($this); } return $this; }
}
