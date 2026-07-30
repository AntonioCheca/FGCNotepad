<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\OkiOptionInteractionRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: OkiOptionInteractionRepository::class)]
#[ORM\Table(name: 'oki_option_interaction', schema: 'sf6')]
#[ORM\Index(name: 'idx_oki_option_interaction_node', columns: ['oki_node_id'])]
#[ORM\Index(name: 'idx_oki_option_interaction_defensive_move', columns: ['defensive_move_id'])]
#[ORM\Index(name: 'idx_oki_option_interaction_character', columns: ['character_id'])]
#[ORM\Index(name: 'idx_oki_option_interaction_result', columns: ['result'])]
class OkiOptionInteraction
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'interactions')]
    #[ORM\JoinColumn(name: 'oki_node_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private OkiNode $node;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'defensive_move_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private Move $defensiveMove;

    #[ORM\Column(length: 24)]
    private string $result;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'character_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?Character $character = null;

    public function getId(): ?int { return $this->id; }
    public function getNode(): OkiNode { return $this->node; }
    public function setNode(OkiNode $node): self { $this->node = $node; return $this; }
    public function getDefensiveMove(): Move { return $this->defensiveMove; }
    public function setDefensiveMove(Move $defensiveMove): self { $this->defensiveMove = $defensiveMove; return $this; }
    public function getResult(): string { return $this->result; }
    public function setResult(string $result): self { $this->result = $result; return $this; }
    public function getCharacter(): ?Character { return $this->character; }
    public function setCharacter(?Character $character): self { $this->character = $character; return $this; }
}
