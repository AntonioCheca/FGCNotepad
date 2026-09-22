<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Character;
use App\Entity\CharacterObject;
use App\Entity\ComboResourceUsage;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\MoveResourceEffect;
use App\Entity\Season;
use App\Entity\User;
use App\Entity\Visibility;
use App\Service\ComboResourceLedgerService;
use App\Service\ComboSequenceCreationService;
use App\Service\MoveResourceEffectService;
use App\Tests\DatabaseTestCase;

final class ComboResourceLedgerServiceTest extends DatabaseTestCase
{
    private const CANS = ['id' => 1, 'object_key' => 'kim_cans', 'name' => 'Cans', 'kind' => 'stock', 'min' => 0, 'max' => 2, 'starts_with' => 1];

    public function testStockIsSpentAndGainedAlongTheCombo(): void
    {
        $ledger = $this->service()->calculate([1 => self::CANS], [
            ['ordinal' => 1, 'notation' => '236K', 'effects' => [['resource_id' => 1, 'mode' => 'relative', 'amount' => -1]]],
            ['ordinal' => 2, 'notation' => '5MP', 'effects' => []],
            ['ordinal' => 3, 'notation' => '214K', 'effects' => [['resource_id' => 1, 'mode' => 'relative', 'amount' => 1]]],
        ]);

        self::assertCount(1, $ledger);
        self::assertSame(1, $ledger[0]['start']);
        self::assertSame(1, $ledger[0]['spent']);
        self::assertSame(1, $ledger[0]['gained']);
        self::assertSame(1, $ledger[0]['end']);
        self::assertSame([-1, 1], array_column($ledger[0]['steps'], 'delta'));
        self::assertSame([], $ledger[0]['warnings']);
    }

    public function testDeclaredStartOverridesTheDefaultAndSetModeReplacesTheValue(): void
    {
        $ledger = $this->service()->calculate([1 => self::CANS], [
            ['ordinal' => 1, 'notation' => '236K', 'effects' => [['resource_id' => 1, 'mode' => 'set', 'amount' => 2]]],
        ], [1 => 0]);

        self::assertSame(0, $ledger[0]['start']);
        self::assertSame(2, $ledger[0]['end']);
        self::assertSame(2, $ledger[0]['gained']);
    }

    public function testValuesAreLimitedToTheResourceRangeWithAWarning(): void
    {
        $ledger = $this->service()->calculate([1 => self::CANS], [
            ['ordinal' => 1, 'notation' => '236K', 'effects' => [['resource_id' => 1, 'mode' => 'relative', 'amount' => -3]]],
        ]);

        self::assertSame(0, $ledger[0]['end']);
        self::assertSame(1, $ledger[0]['spent']);
        self::assertCount(1, $ledger[0]['warnings']);
    }

    public function testMovesWithoutEffectsProduceNoLedger(): void
    {
        self::assertSame([], $this->service()->calculate([1 => self::CANS], [['ordinal' => 1, 'notation' => '5MP', 'effects' => []]]));
    }

    public function testCreatingAComboStoresUsageAndChangingAnEffectRefreshesIt(): void
    {
        $moderator = (new User())->setUsername('moderator_user')->setPassword(self::hashTestPassword())->setRoles(['ROLE_MODERATOR'])->setIsActive(true);
        $comboType = (new ComboSequenceType())->setName('combo');
        $leafType = (new ComboSequenceType())->setName('leaf');
        $visibility = (new Visibility())->setName('public');
        $connection = (new ConnectionType())->setName('Initial Move');
        $season = (new Season())->setName('S1')->setStartDate(new \DateTimeImmutable('2025-01-01'));
        $character = (new Character())->setName('Manon');
        $move = (new Move())->setCharacter($character)->setNumpadNotation('236K')->setFrameData((new FrameData())->setMoveType('special'));
        $leaf = (new ComboSequences())->setName('Manon 236K')->setDescription('leaf')->setMove($move)->setType($leafType)->setVisibility($visibility);
        foreach ([$moderator, $comboType, $leafType, $visibility, $connection, $season, $character, $move, $move->getFrameData(), $leaf] as $entity) {
            $this->entityManager->persist($entity);
        }
        $medals = (new CharacterObject())->setCharacter($character)->setObjectKey('manon_medals')->setName('Medals')->setKind('scaler')->setStatusType('integer')->setMaxStatus(5)->setStartsWith(1)->setCanBeAddedRelative(true);
        $this->entityManager->persist($medals);
        $this->entityManager->flush();

        $effects = static::getContainer()->get(MoveResourceEffectService::class);
        $effects->replaceEffects($move, [['resourceId' => $medals->getId(), 'mode' => 'relative', 'amount' => 1]], $moderator);

        $combo = static::getContainer()->get(ComboSequenceCreationService::class)->createFromPayload(
            ['name' => 'Medal combo', 'description' => 'x'],
            'combo',
            [['child_sequence_id' => $leaf->getId(), 'ordinal_in_combo' => 1, 'connection_type_id' => $connection->getId()]],
        );

        $usage = $this->entityManager->getRepository(ComboResourceUsage::class)->findOneBy(['combo' => $combo]);
        self::assertInstanceOf(ComboResourceUsage::class, $usage);
        self::assertSame([1, 0, 1, 2], [$usage->getStartValue(), $usage->getSpent(), $usage->getGained(), $usage->getEndValue()]);

        $effects->replaceEffects($move, [['resourceId' => $medals->getId(), 'mode' => 'relative', 'amount' => 2]], $moderator);
        $this->entityManager->clear();

        $refreshed = $this->entityManager->getRepository(ComboResourceUsage::class)->findAll();
        self::assertCount(1, $refreshed);
        self::assertSame([2, 3], [$refreshed[0]->getGained(), $refreshed[0]->getEndValue()]);

        $effects->replaceEffects($move, [], $moderator);
        $this->entityManager->clear();
        self::assertCount(0, $this->entityManager->getRepository(ComboResourceUsage::class)->findAll());
        self::assertCount(0, $this->entityManager->getRepository(MoveResourceEffect::class)->findAll());
    }

    private function service(): ComboResourceLedgerService
    {
        return static::getContainer()->get(ComboResourceLedgerService::class);
    }
}
