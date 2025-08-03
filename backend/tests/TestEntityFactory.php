<?php declare(strict_types=1);

namespace App\Tests;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\Move;
use App\Entity\Visibility;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Uid\Uuid;

class TestEntityFactory
{
    public function __construct(private EntityManagerInterface $em) {}

    public function createCharacter(string $name = 'Ryu'): Character
    {
        $character = new Character();
        $character->setName($name);

        $this->em->persist($character);
        return $character;
    }

    public function createMove(array $overrides = []): Move
    {
        $move = new Move();

        $character = $overrides['character'] ?? $this->createCharacter();
        $numpad = $overrides['numpadNotation'] ?? '5LP';

        $move->setCharacter($character);
        $move->setNumpadNotation($numpad);

        $this->em->persist($move);
        return $move;
    }

    public function createComboSequence(array $overrides = []): ComboSequences
    {
        $sequence = new ComboSequences();

        // Set basic properties
        $sequence->setName($overrides['name'] ?? 'Test Combo Sequence');
        $sequence->setDescription($overrides['description'] ?? 'Test combo description');

        // Handle required relationships
        $move = $overrides['move'] ?? $this->createMove();
        $sequence->setMove($move);

        // Get or create required entities
        $type = $overrides['type'] ?? $this->getOrCreateComboSequenceType();
        $sequence->setType($type);

        $visibility = $overrides['visibility'] ?? $this->getOrCreateVisibility();
        $sequence->setVisibility($visibility);

        $this->em->persist($sequence);
        return $sequence;
    }

    public function createComboSequenceType(string $name = 'Test Type'): ComboSequenceType
    {
        $type = new ComboSequenceType();
        $type->setName($name);

        $this->em->persist($type);
        return $type;
    }

    public function createVisibility(string $name = 'Public'): Visibility
    {
        $visibility = new Visibility();
        $visibility->setName($name);

        $this->em->persist($visibility);
        return $visibility;
    }

    private function getOrCreateComboSequenceType(): ComboSequenceType
    {
        // Try to find existing type first
        $type = $this->em->getRepository(ComboSequenceType::class)->findOneBy([]);

        if (!$type) {
            $type = $this->createComboSequenceType();
        }

        return $type;
    }

    private function getOrCreateVisibility(): Visibility
    {
        // Try to find existing visibility first
        $visibility = $this->em->getRepository(Visibility::class)->findOneBy([]);

        if (!$visibility) {
            $visibility = $this->createVisibility();
        }

        return $visibility;
    }
}
