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
        ];

        $this->connectionTypes = [
            ['id' => 1, 'name' => 'Initial Move'],
            ['id' => 2, 'name' => 'Chain'],
            ['id' => 3, 'name' => 'Special'],
            ['id' => 4, 'name' => 'Super Cancel'],
            ['id' => 5, 'name' => 'Target Combo'],
            ['id' => 6, 'name' => 'Link'],
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
}
