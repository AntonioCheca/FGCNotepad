<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\OkiProfileRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: OkiProfileRepository::class)]
#[ORM\Table(name: 'oki_profile', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_oki_profile_move', columns: ['move_id'])]
class OkiProfile
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne]
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Move $move;

    #[ORM\Column(name: 'frame_advantage', type: Types::SMALLINT, nullable: true)]
    private ?int $frameAdvantage = null;

    /** @var Collection<int, OkiSetup> */
    #[ORM\OneToMany(targetEntity: OkiSetup::class, mappedBy: 'profile', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['id' => 'ASC'])]
    private Collection $setups;

    public function __construct()
    {
        $this->setups = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getMove(): Move { return $this->move; }
    public function setMove(Move $move): self { $this->move = $move; return $this; }
    public function getFrameAdvantage(): ?int { return $this->frameAdvantage; }
    public function setFrameAdvantage(?int $frameAdvantage): self { $this->frameAdvantage = $frameAdvantage; return $this; }

    /** @return Collection<int, OkiSetup> */
    public function getSetups(): Collection { return $this->setups; }

    public function addSetup(OkiSetup $setup): self
    {
        if (!$this->setups->contains($setup)) {
            $this->setups->add($setup);
            $setup->setProfile($this);
        }

        return $this;
    }

    public function removeSetup(OkiSetup $setup): self
    {
        $this->setups->removeElement($setup);

        return $this;
    }

    public function clearSetups(): self
    {
        foreach ($this->setups->toArray() as $setup) {
            $this->removeSetup($setup);
        }

        return $this;
    }
}
