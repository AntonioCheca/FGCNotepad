<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\UserScenarioPreferenceRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserScenarioPreferenceRepository::class)]
#[ORM\Table(name: 'user_scenario_preference', schema: 'forum')]
class UserScenarioPreference
{
    public const NOTATION_DICTIONARY_NUMPAD = 'numpad';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'scenarioPreference')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, unique: true)]
    private ?User $user = null;

    #[ORM\Column(name: 'default_mode', length: 32)]
    private string $defaultMode = 'standard';

    #[ORM\Column(name: 'difficulty_cap', nullable: true)]
    private ?int $difficultyCap = null;

    #[ORM\Column(name: 'notation_dictionary', length: 32, options: ['default' => self::NOTATION_DICTIONARY_NUMPAD])]
    private string $notationDictionary = self::NOTATION_DICTIONARY_NUMPAD;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        if (null !== $user && $user->getScenarioPreference() !== $this) {
            $user->setScenarioPreference($this);
        }

        return $this;
    }

    public function getDefaultMode(): string
    {
        return $this->defaultMode;
    }

    public function setDefaultMode(string $defaultMode): static
    {
        $this->defaultMode = $defaultMode;

        return $this;
    }

    public function getDifficultyCap(): ?int
    {
        return $this->difficultyCap;
    }

    public function setDifficultyCap(?int $difficultyCap): static
    {
        $this->difficultyCap = $difficultyCap;

        return $this;
    }

    public function getNotationDictionary(): string
    {
        return $this->notationDictionary;
    }

    public function setNotationDictionary(string $notationDictionary): static
    {
        $this->notationDictionary = $notationDictionary;

        return $this;
    }
}
