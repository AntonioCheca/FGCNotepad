<?php declare(strict_types=1);

namespace App\Tests\Service\Modern;

use App\Entity\Character;
use App\Entity\Move;
use App\Service\Modern\ModernComboLegalityValidator;
use PHPUnit\Framework\TestCase;

final class ModernComboLegalityValidatorTest extends TestCase
{
    private ModernComboLegalityValidator $validator;
    private Character $character;

    protected function setUp(): void
    {
        $this->validator = new ModernComboLegalityValidator();
        $this->character = (new Character())->setName('A.K.I.');
    }

    public function testDirectlyAvailableMovesAreLegal(): void
    {
        self::assertTrue($this->validator->isLegal([$this->move('2MK'), $this->move('236HP')], []));
    }

    public function testAnUnavailableMoveOutsideAnyAutoComboIsIllegal(): void
    {
        self::assertFalse($this->validator->isLegal([$this->move('2MK'), $this->move('5LK', false)], []));
    }

    public function testAnUnavailableMoveIsLegalWhenTheAutoComboPrefixPrecedesIt(): void
    {
        $opener = $this->move('5MP');
        $autoOnly = $this->move('5MK', false);
        $ender = $this->move('236MP');

        self::assertTrue($this->validator->isLegal([$opener, $autoOnly, $ender], [[$opener, $autoOnly, $ender]]));
    }

    public function testTheAutoComboPrefixMustImmediatelyPrecedeTheMove(): void
    {
        $opener = $this->move('5MP');
        $autoOnly = $this->move('5MK', false);
        $other = $this->move('2LP');

        self::assertFalse($this->validator->isLegal([$opener, $other, $autoOnly], [[$opener, $autoOnly]]), 'Another move between the prefix and the move breaks the auto combo.');
        self::assertFalse($this->validator->isLegal([$autoOnly, $opener], [[$opener, $autoOnly]]), 'The auto combo first move cannot be reached this way.');
    }

    public function testChainedAutoComboOnlyMovesNeedTheWholePrefix(): void
    {
        $opener = $this->move('5HP');
        $second = $this->move('5HK', false);
        $third = $this->move('6HK', false);
        $autoCombo = [$opener, $second, $third];

        self::assertTrue($this->validator->isLegal([$this->move('2LP'), $opener, $second, $third], [$autoCombo]));
        self::assertFalse($this->validator->isLegal([$second, $third], [$autoCombo]));
    }

    private function move(string $notation, bool $availableOnModern = true): Move
    {
        return (new Move())
            ->setCharacter($this->character)
            ->setNumpadNotation($notation)
            ->setAvailableOnModern($availableOnModern);
    }
}
