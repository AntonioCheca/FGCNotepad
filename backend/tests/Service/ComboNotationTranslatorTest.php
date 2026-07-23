<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\ComboNotationTranslator;
use PHPUnit\Framework\TestCase;

class ComboNotationTranslatorTest extends TestCase
{
    private ComboNotationTranslator $translator;

    /**
     * @var array<int, array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}>
     */
    private array $leafOptions;

    /**
     * @var array<int, array{id:int, name:string}>
     */
    private array $connectionTypes;

    protected function setUp(): void
    {
        $this->translator = new ComboNotationTranslator();

        $this->leafOptions = [
            ['id' => 101, 'notation' => '2LP', 'moveType' => 'normal', 'cancelTypeCodes' => ['ch', 'sp', 'su']],
            ['id' => 102, 'notation' => '5LP', 'moveType' => 'normal', 'cancelTypeCodes' => ['ch', 'sp']],
            ['id' => 103, 'notation' => '236MK', 'moveType' => 'special', 'cancelTypeCodes' => ['su']],
            ['id' => 104, 'notation' => '236236P', 'moveType' => 'super', 'cancelTypeCodes' => []],
            ['id' => 105, 'notation' => '5MP', 'moveType' => 'normal', 'cancelTypeCodes' => []],
            ['id' => 106, 'notation' => '4HP', 'moveType' => 'follow-up', 'cancelTypeCodes' => ['tc']],
            ['id' => 107, 'notation' => '63214P', 'moveType' => 'command-grab', 'cancelTypeCodes' => []],
            ['id' => 108, 'notation' => '214PPXX6P', 'moveType' => 'follow-up', 'cancelTypeCodes' => ['tc'], 'aliases' => ['214PP XX 6P', '214PP > 6P']],
            ['id' => 109, 'notation' => '214PP', 'moveType' => 'special', 'cancelTypeCodes' => ['sp']],
            ['id' => 110, 'notation' => '6P', 'moveType' => 'normal', 'cancelTypeCodes' => []],
            ['id' => 111, 'notation' => '2MP', 'moveType' => 'normal', 'cancelTypeCodes' => ['tc']],
            ['id' => 112, 'notation' => '2MP>MP', 'moveType' => 'normal', 'cancelTypeCodes' => ['sp']],
            ['id' => 113, 'notation' => '5MP>MP', 'moveType' => 'normal', 'cancelTypeCodes' => ['sp']],
            ['id' => 114, 'notation' => '5HP', 'moveType' => 'normal', 'cancelTypeCodes' => []],
            ['id' => 115, 'notation' => '5HK', 'moveType' => 'normal', 'cancelTypeCodes' => ['tc']],
            ['id' => 116, 'notation' => '5HK>HK', 'moveType' => 'normal', 'cancelTypeCodes' => ['sp']],
            ['id' => 117, 'notation' => '6HP', 'moveType' => 'normal', 'cancelTypeCodes' => ['tc']],
            ['id' => 118, 'notation' => '6HP>6HP', 'moveType' => 'normal', 'cancelTypeCodes' => []],
            ['id' => 119, 'notation' => '236K', 'moveType' => 'special', 'cancelTypeCodes' => []],
            ['id' => 120, 'notation' => '236K>P', 'moveType' => 'special', 'cancelTypeCodes' => []],
        ];

        $this->connectionTypes = [
            ['id' => 1, 'name' => 'Initial Move'],
            ['id' => 2, 'name' => 'Chain'],
            ['id' => 3, 'name' => 'Special'],
            ['id' => 4, 'name' => 'Super Cancel'],
            ['id' => 5, 'name' => 'Target Combo'],
            ['id' => 6, 'name' => 'Link'],
            ['id' => 7, 'name' => 'DR Cancel'],
        ];
    }

    public function testTranslateNormalCombo(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('2LP, 2LP, 236MK', $this->leafOptions, $this->connectionTypes);

        self::assertCount(3, $result['steps']);
        self::assertSame(1, $result['steps'][0]['connection_type_id']);
        self::assertSame(2, $result['steps'][1]['connection_type_id']);
        self::assertSame(3, $result['steps'][2]['connection_type_id']);
        self::assertSame([], $result['errors']);
    }

    public function testTranslateReturnsPartialErrorsForUnknownMove(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('2LP, 0LP, 236MK', $this->leafOptions, $this->connectionTypes);

        self::assertCount(2, $result['steps']);
        self::assertCount(1, $result['errors']);
        self::assertSame('0LP', $result['errors'][0]['token']);
        self::assertSame('unknown_move', $result['errors'][0]['code']);
    }

    public function testTranslateSingleMoveUsesInitialMoveConnection(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('236MK', $this->leafOptions, $this->connectionTypes);

        self::assertCount(1, $result['steps']);
        self::assertSame(1, $result['steps'][0]['connection_type_id']);
    }

    public function testTranslateExplicitCancelInfersSpecialCancel(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('2LP XX 236MK', $this->leafOptions, $this->connectionTypes);

        self::assertCount(2, $result['steps']);
        self::assertSame(3, $result['steps'][1]['connection_type_id']);
    }

    public function testTranslateExplicitCancelInfersSuperCancel(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('2LP XX 236236P', $this->leafOptions, $this->connectionTypes);

        self::assertCount(2, $result['steps']);
        self::assertSame(4, $result['steps'][1]['connection_type_id']);
    }

    public function testTranslateInfersChainConnection(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('5LP, 2LP', $this->leafOptions, $this->connectionTypes);

        self::assertCount(2, $result['steps']);
        self::assertSame(2, $result['steps'][1]['connection_type_id']);
    }

    public function testTranslateInfersLinkWhenNormalsAreNotBothChainCancellable(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('5MP, 2LP', $this->leafOptions, $this->connectionTypes);

        self::assertCount(2, $result['steps']);
        self::assertSame(6, $result['steps'][1]['connection_type_id']);
    }

    public function testTranslateInfersLinkConnection(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('2LP, 63214P', $this->leafOptions, $this->connectionTypes);

        self::assertCount(2, $result['steps']);
        self::assertSame(6, $result['steps'][1]['connection_type_id']);
    }

    public function testTranslateExplicitTargetComboConnector(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('5MP TC 4HP', $this->leafOptions, $this->connectionTypes);

        self::assertCount(2, $result['steps']);
        self::assertSame(5, $result['steps'][1]['connection_type_id']);
    }

    public function testTranslateLongMixedCombo(): void
    {
        $result = $this->translator->translateNotationToInternalSteps(
            '5LP, 2LP XX 236MK XX 236236P TC 4HP 63214P',
            $this->leafOptions,
            $this->connectionTypes
        );

        self::assertCount(6, $result['steps']);
        self::assertSame(1, $result['steps'][0]['connection_type_id']);
        self::assertSame(2, $result['steps'][1]['connection_type_id']);
        self::assertSame(3, $result['steps'][2]['connection_type_id']);
        self::assertSame(4, $result['steps'][3]['connection_type_id']);
        self::assertSame(5, $result['steps'][4]['connection_type_id']);
        self::assertSame(6, $result['steps'][5]['connection_type_id']);
        self::assertSame([], $result['errors']);
    }

    public function testTranslatePrioritizesLongestCompositeAliasFirst(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('214PP XX 6P', $this->leafOptions, $this->connectionTypes);

        self::assertCount(1, $result['steps']);
        self::assertSame(108, $result['steps'][0]['child_sequence_id']);
        self::assertSame([], $result['errors']);
    }

    public function testTranslatePrefersContextualTargetComboCompositeLeaf(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('2MP, MP', $this->leafOptions, $this->connectionTypes);

        self::assertCount(1, $result['steps']);
        self::assertSame(112, $result['steps'][0]['child_sequence_id']);
        self::assertSame('2MP > MP', $result['steps'][0]['token']);
        self::assertSame([], $result['errors']);
    }

    public function testTranslateDoesNotMergeTargetComboWhenPreviousMoveLacksTc(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('5MP, 5MP', $this->leafOptions, $this->connectionTypes);

        self::assertCount(2, $result['steps']);
        self::assertSame(105, $result['steps'][0]['child_sequence_id']);
        self::assertSame(105, $result['steps'][1]['child_sequence_id']);
        self::assertSame([], $result['errors']);
    }

    public function testTranslateDoesNotMergeTargetComboWhenNoCompositeMoveMatches(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('2MP, 5HP', $this->leafOptions, $this->connectionTypes);

        self::assertCount(2, $result['steps']);
        self::assertSame(111, $result['steps'][0]['child_sequence_id']);
        self::assertSame(114, $result['steps'][1]['child_sequence_id']);
        self::assertSame([], $result['errors']);
    }

    public function testTranslateMergesTargetComboAcrossExplicitCancelConnector(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('5HK XX HK', $this->leafOptions, $this->connectionTypes);

        self::assertCount(1, $result['steps']);
        self::assertSame(116, $result['steps'][0]['child_sequence_id']);
        self::assertSame('5HK > HK', $result['steps'][0]['token']);
        self::assertSame([], $result['errors']);
    }

    public function testTranslateMergesDirectionalTargetComboFollowUp(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('6HP XX 6HP', $this->leafOptions, $this->connectionTypes);

        self::assertCount(1, $result['steps']);
        self::assertSame(118, $result['steps'][0]['child_sequence_id']);
        self::assertSame('6HP > 6HP', $result['steps'][0]['token']);
        self::assertSame([], $result['errors']);
    }

    public function testTranslateFallsBackSpecificStrengthToGenericSpecialAndMergesFollowUp(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('236HK XX P', $this->leafOptions, $this->connectionTypes);

        self::assertCount(1, $result['steps']);
        self::assertSame(120, $result['steps'][0]['child_sequence_id']);
        self::assertSame('236K > P', $result['steps'][0]['token']);
        self::assertSame([], $result['errors']);
    }

    public function testTranslateDriveRushCancelConnector(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('2LP DRC 2LP', $this->leafOptions, $this->connectionTypes);

        self::assertCount(2, $result['steps']);
        self::assertSame(7, $result['steps'][1]['connection_type_id']);
        self::assertSame('DR Cancel', $result['steps'][1]['connection_type_name']);
        self::assertSame([], $result['errors']);
    }

    public function testTranslateDriveRushCancelWithSurroundingCancelSeparators(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('2LP XX DR XX 2LP', $this->leafOptions, $this->connectionTypes);

        self::assertCount(2, $result['steps']);
        self::assertSame(7, $result['steps'][1]['connection_type_id']);
        self::assertSame([], $result['errors']);
    }

    public function testTranslateDriveRushCancelWithArrowSeparators(): void
    {
        $result = $this->translator->translateNotationToInternalSteps('2LP > DR > 2LP', $this->leafOptions, $this->connectionTypes);

        self::assertCount(2, $result['steps']);
        self::assertSame(7, $result['steps'][1]['connection_type_id']);
        self::assertSame([], $result['errors']);
    }
}
