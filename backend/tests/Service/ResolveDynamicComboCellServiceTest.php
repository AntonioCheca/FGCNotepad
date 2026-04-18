<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Character;
use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\Step;
use App\Entity\Visibility;
use App\Service\ResolveDynamicComboCellService;
use App\Tests\DatabaseTestCase;

class ResolveDynamicComboCellServiceTest extends DatabaseTestCase
{
    private ResolveDynamicComboCellService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->service = static::getContainer()->get(ResolveDynamicComboCellService::class);
    }

    public function testNormalHitMatchesOnlyNormalCombos(): void
    {
        [$character, $starterMove] = $this->seedComboGraph();

        $result = $this->service->resolve((string) $character->getId(), [(string) $starterMove->getId()], 'normal');

        self::assertSame(1200.0, $result['resolvedDamage']);
        self::assertNotNull($result['resolvedComboId']);
        self::assertSame((string) $starterMove->getId(), $result['resolvedStarterMoveId']);
    }

    public function testCounterHitMatchesCounterAndNormalCombos(): void
    {
        [$character, $starterMove] = $this->seedComboGraph();

        $result = $this->service->resolve((string) $character->getId(), [(string) $starterMove->getId()], 'counter_hit');

        self::assertSame(1500.0, $result['resolvedDamage']);
        self::assertNotNull($result['resolvedComboId']);
        self::assertSame((string) $starterMove->getId(), $result['resolvedStarterMoveId']);
    }

    public function testPunishCounterMatchesAllHitTiers(): void
    {
        [$character, $starterMove] = $this->seedComboGraph();

        $result = $this->service->resolve((string) $character->getId(), [(string) $starterMove->getId()], 'punish_counter');

        self::assertSame(1800.0, $result['resolvedDamage']);
        self::assertNotNull($result['resolvedComboId']);
        self::assertSame((string) $starterMove->getId(), $result['resolvedStarterMoveId']);
    }

    public function testFallsBackToStarterMoveDamageWhenNoComboMatches(): void
    {
        [$character, , $fallbackStarterMove] = $this->seedComboGraph();

        $result = $this->service->resolve((string) $character->getId(), [(string) $fallbackStarterMove->getId()], 'normal');

        self::assertSame(260.0, $result['resolvedDamage']);
        self::assertNull($result['resolvedComboId']);
        self::assertSame((string) $fallbackStarterMove->getId(), $result['resolvedStarterMoveId']);
    }

    /**
     * @return array{0: Character, 1: Move, 2: Move}
     */
    private function seedComboGraph(): array
    {
        $character = (new Character())->setName('Ken');
        $this->entityManager->persist($character);

        $leafType = (new ComboSequenceType())->setName('leaf');
        $comboType = (new ComboSequenceType())->setName('combo');
        $this->entityManager->persist($leafType);
        $this->entityManager->persist($comboType);

        $visibility = (new Visibility())->setName('public');
        $connectionType = (new ConnectionType())->setName('Initial Move');
        $this->entityManager->persist($visibility);
        $this->entityManager->persist($connectionType);

        $starterMove = $this->createMoveWithDamage($character, '2LK', 300);
        $fallbackStarterMove = $this->createMoveWithDamage($character, '5LK', 260);

        $starterLeaf = (new ComboSequences())
            ->setName('Ken 2LK')
            ->setDescription('leaf')
            ->setType($leafType)
            ->setVisibility($visibility)
            ->setMove($starterMove);
        $this->entityManager->persist($starterLeaf);

        $fallbackLeaf = (new ComboSequences())
            ->setName('Ken 5LK')
            ->setDescription('leaf')
            ->setType($leafType)
            ->setVisibility($visibility)
            ->setMove($fallbackStarterMove);
        $this->entityManager->persist($fallbackLeaf);

        $this->createCombo($comboType, $visibility, $connectionType, $starterLeaf, 1200, false, false);
        $this->createCombo($comboType, $visibility, $connectionType, $starterLeaf, 1500, true, false);
        $this->createCombo($comboType, $visibility, $connectionType, $starterLeaf, 1800, false, true);

        $this->entityManager->flush();

        return [$character, $starterMove, $fallbackStarterMove];
    }

    private function createMoveWithDamage(Character $character, string $notation, int $damage): Move
    {
        $move = (new Move())
            ->setCharacter($character)
            ->setNumpadNotation($notation);

        $frameData = (new FrameData())
            ->setDamage($damage)
            ->setMoveType('normal');

        $move->setFrameData($frameData);

        $this->entityManager->persist($move);
        $this->entityManager->persist($frameData);

        return $move;
    }

    private function createCombo(
        ComboSequenceType $comboType,
        Visibility $visibility,
        ConnectionType $connectionType,
        ComboSequences $starterLeaf,
        int $damage,
        bool $counterHitRequired,
        bool $punishCounterRequired,
    ): void {
        $combo = (new ComboSequences())
            ->setName(sprintf('Combo %d', $damage))
            ->setDescription('combo')
            ->setType($comboType)
            ->setVisibility($visibility);
        $this->entityManager->persist($combo);

        $metrics = (new ComboMetrics())
            ->setSequence($combo)
            ->setDamage($damage);
        $this->entityManager->persist($metrics);

        $step = (new Step())
            ->setParentSequence($combo)
            ->setChildSequence($starterLeaf)
            ->setOrdinalInCombo(1)
            ->setConnectionType($connectionType);
        $this->entityManager->persist($step);

        $requirement = (new ComboRequirement())
            ->setSequence($combo)
            ->setCounterHitRequired($counterHitRequired)
            ->setPunishCounterRequired($punishCounterRequired)
            ->setCornerRequired(false)
            ->setAirborneRequired(false)
            ->setMidScreenRequired(false)
            ->setNotCrouchingRequired(false);
        $this->entityManager->persist($requirement);
    }
}
