<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Character;
use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\ComboSpacing;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\CharacterObjectState;
use App\Entity\Season;
use App\Entity\Step;
use App\Entity\Visibility;
use App\Service\ComboSequenceCreationService;
use App\Tests\DatabaseTestCase;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class ComboSequenceCreationServiceTest extends DatabaseTestCase
{
    private ComboSequenceCreationService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = static::getContainer()->get(ComboSequenceCreationService::class);
    }

    public function testCreateFromPayloadPersistsBasicSequenceFlow(): void
    {
        $this->persistCreationLookups();

        $sequence = $this->service->createFromPayload([
            'name' => 'BnB Sequence',
            'description' => 'Simple route',
            'visibility' => 'public',
            'metrics' => [
                'damage' => 1820,
            ],
        ], 'sequence');

        self::assertNotNull($sequence->getId());
        self::assertSame('sequence', $sequence->getType()?->getName());
        self::assertSame('public', $sequence->getVisibility()?->getName());
        self::assertNull($sequence->getSpacing());
        self::assertCount(1, $sequence->getSeason());
        self::assertCount(0, $sequence->getSteps());

        $persistedMetrics = $this->entityManager->getRepository(ComboMetrics::class)->findOneBy(['sequence' => $sequence]);
        self::assertInstanceOf(ComboMetrics::class, $persistedMetrics);
        self::assertSame(1820, $persistedMetrics->getDamage());
    }

    public function testCreateFromPayloadPersistsRequirementsAndStepsForFullFlow(): void
    {
        $this->persistCreationLookups();
        $initialConnection = (new ConnectionType())->setName('Initial Move');
        $this->entityManager->persist($initialConnection);

        $leafSequence = $this->persistLeafSequence();
        $this->entityManager->flush();

        $sequence = $this->service->createFromPayload([
            'name' => 'Jamie Drink Combo',
            'description' => 'Works only at 2 drinks',
            'requirements' => [
                'counter_hit_required' => true,
                'not_crouching_required' => true,
                'side_switches_required' => true,
                'combo_object_states' => [[
                    'object_key' => 'jamie_drinks',
                    'object_name' => 'Drinks',
                    'status_required' => '2',
                    'added_relative' => '1',
                ]],
            ],
        ], 'combo', [
            [
                'child_sequence_id' => $leafSequence->getId(),
                'ordinal_in_combo' => 1,
                'connection_type_id' => $initialConnection->getId(),
            ],
        ]);

        self::assertNotNull($sequence->getId());
        self::assertSame('combo', $sequence->getType()?->getName());

        $persistedRequirement = $this->entityManager->getRepository(ComboRequirement::class)->findOneBy(['sequence' => $sequence]);
        self::assertInstanceOf(ComboRequirement::class, $persistedRequirement);
        self::assertTrue($persistedRequirement->isCounterHitRequired());
        self::assertTrue($persistedRequirement->isNotCrouchingRequired());
        self::assertTrue($persistedRequirement->isSideSwitchesRequired());

        $specificRequirement = $persistedRequirement->getRequirementSpecificCharacter();
        self::assertInstanceOf(CharacterObjectState::class, $specificRequirement);
        self::assertSame('jamie_drinks', $specificRequirement->getObjectKey());
        self::assertSame('Drinks', $specificRequirement->getObjectName());
        self::assertSame('2', $specificRequirement->getStatusRequired());
        self::assertSame('1', $specificRequirement->getAddedRelative());

        $persistedStep = $this->entityManager->getRepository(Step::class)->findOneBy([
            'parent_sequence' => $sequence,
            'ordinal_in_combo' => 1,
        ]);
        self::assertInstanceOf(Step::class, $persistedStep);
        self::assertSame($leafSequence->getId(), $persistedStep->getChildSequence()?->getId());
        self::assertSame('Initial Move', $persistedStep->getConnectionType()?->getName());
    }

    public function testCreateFromPayloadPersistsSpacingByCode(): void
    {
        $this->persistCreationLookups();
        $spacing = $this->entityManager->getRepository(ComboSpacing::class)->findOneBy(['code' => 'tip']);
        if (!$spacing instanceof ComboSpacing) {
            $spacing = (new ComboSpacing())
                ->setCode('tip')
                ->setName('Tip')
                ->setDescription('Normal tip range.')
                ->setSortOrder(30);
            $this->entityManager->persist($spacing);
        }
        $this->entityManager->flush();

        $sequence = $this->service->createFromPayload([
            'name' => 'Tip Combo',
            'spacingCode' => 'tip',
        ], 'combo');

        self::assertSame($spacing->getId(), $sequence->getSpacing()?->getId());
        self::assertSame('tip', $sequence->getSpacing()?->getCode());
    }

    public function testCreateFromPayloadRejectsUnknownSpacingCode(): void
    {
        $this->persistCreationLookups();

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('spacingCode does not reference an existing spacing option.');

        $this->service->createFromPayload([
            'name' => 'Invalid Spacing Combo',
            'spacingCode' => 'full_screen',
        ], 'combo');
    }

    public function testCreateFromPayloadRecalculatesResourceMetricsFromSteps(): void
    {
        $this->persistCreationLookups();
        $initialConnection = (new ConnectionType())->setName('Initial Move');
        $this->entityManager->persist($initialConnection);

        $leafSequence = $this->persistLeafSequence(-20000, 7, 4, 12, 20);
        $this->entityManager->flush();

        $sequence = $this->service->createFromPayload([
            'name' => 'Jamie OD Combo',
            'description' => 'Spends drive',
            'visibility' => 'public',
            'metrics' => [
                'damage' => 1200,
                'driveCost' => 0,
                'driveGain' => 0,
            ],
        ], 'combo', [
            [
                'child_sequence_id' => $leafSequence->getId(),
                'ordinal_in_combo' => 1,
                'connection_type_id' => $initialConnection->getId(),
            ],
        ]);

        $metrics = $sequence->getComboMetrics();
        self::assertInstanceOf(ComboMetrics::class, $metrics);
        self::assertSame(2.0, $metrics->getDriveCost());
        self::assertSame(0.172, $metrics->getDriveGain());
        self::assertSame(0.1, $metrics->getMinimumDriveCost());
        self::assertSame(2.1, $metrics->getMinimumDriveCostNoBurnout());
    }

    public function testCreateFromPayloadConvertsRequirementValidationToBadRequest(): void
    {
        $this->persistCreationLookups();

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('counter_hit_required and punish_counter_required cannot both be true.');

        $this->service->createFromPayload([
            'name' => 'Invalid Requirement Combo',
            'requirements' => [
                'counter_hit_required' => true,
                'punish_counter_required' => true,
            ],
        ], 'combo');
    }

    private function persistCreationLookups(): void
    {
        $comboType = (new ComboSequenceType())->setName('combo');
        $sequenceType = (new ComboSequenceType())->setName('sequence');
        $leafType = (new ComboSequenceType())->setName('leaf');
        $visibility = (new Visibility())->setName('public');
        $season = (new Season())
            ->setName('S1')
            ->setStartDate(new \DateTimeImmutable('2025-01-01'));

        $this->entityManager->persist($comboType);
        $this->entityManager->persist($sequenceType);
        $this->entityManager->persist($leafType);
        $this->entityManager->persist($visibility);
        $this->entityManager->persist($season);
        $this->entityManager->flush();
    }

    private function persistLeafSequence(?int $driveGain = null, ?int $startup = null, ?int $active = null, ?int $hitstop = null, ?int $recovery = null): ComboSequences
    {
        $character = (new Character())->setName('Jamie');
        $move = (new Move())
            ->setCharacter($character)
            ->setNumpadNotation('2LP');
        $frameData = (new FrameData())->setMoveType('normal');
        if (null !== $driveGain) {
            $frameData->setDriveGain($driveGain);
        }
        if (null !== $startup) {
            $frameData->setStartup($startup);
        }
        if (null !== $active) {
            $frameData->setActive($active);
        }
        if (null !== $hitstop) {
            $frameData->setHitstop($hitstop);
        }
        if (null !== $recovery) {
            $frameData->setRecovery($recovery);
        }
        $move->setFrameData($frameData);

        $leafType = $this->entityManager->getRepository(ComboSequenceType::class)->findOneBy(['name' => 'leaf']);
        $visibility = $this->entityManager->getRepository(Visibility::class)->findOneBy(['name' => 'public']);

        $leafSequence = (new ComboSequences())
            ->setName('Jamie 2LP')
            ->setDescription('leaf')
            ->setMove($move)
            ->setType($leafType)
            ->setVisibility($visibility);

        $this->entityManager->persist($character);
        $this->entityManager->persist($move);
        $this->entityManager->persist($frameData);
        $this->entityManager->persist($leafSequence);

        return $leafSequence;
    }
}
