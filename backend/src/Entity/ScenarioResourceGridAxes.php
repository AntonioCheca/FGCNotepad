<?php declare(strict_types=1);

namespace App\Entity;

/**
 * The axes of a ScenarioResourceGrid, in index order from outermost to innermost: corner-specific combos (off, on;
 * only for scenarios without a position lock), defender Drive, defender Super, attacker object, attacker Super,
 * attacker Drive, defender object. The order keeps runs of equal
 * solutions long: on the current okis it stores about 5 times fewer runs than listing the attacker first. Drive
 * moves in half bars like the scenario page's slider. An object axis runs from 0 to its max; with no object it has
 * the single value 0.
 */
final class ScenarioResourceGridAxes
{
    public const DRIVE_STEP = 0.5;
    public const DRIVE_MAX = 6.0;
    public const SUPER_MAX = 3;

    public function __construct(
        public readonly ?string $attackerObjectKey,
        public readonly int $attackerObjectMax,
        public readonly ?string $defenderObjectKey,
        public readonly int $defenderObjectMax,
        public readonly bool $cornerToggle,
    ) {
    }

    public function count(): int
    {
        return ($this->cornerToggle ? 2 : 1) * self::driveSteps() ** 2 * (self::SUPER_MAX + 1) ** 2
            * ($this->attackerObjectMax + 1) * ($this->defenderObjectMax + 1);
    }

    public static function driveSteps(): int
    {
        return (int) round(self::DRIVE_MAX / self::DRIVE_STEP) + 1;
    }

    /**
     * Every combination in index order.
     *
     * @return \Generator<int, array{includeCornerSpecific:bool,attacker:array{drive:float,super:float,object:int},defender:array{drive:float,super:float,object:int}}>
     */
    public function combinations(): \Generator
    {
        $index = 0;
        $driveSteps = range(0, self::driveSteps() - 1);
        $superSteps = range(0, self::SUPER_MAX);
        foreach ($this->cornerToggle ? [false, true] : [false] as $includeCornerSpecific) {
            foreach ($driveSteps as $defenderDrive) {
                foreach ($superSteps as $defenderSuper) {
                    foreach (range(0, $this->attackerObjectMax) as $attackerObject) {
                        foreach ($superSteps as $attackerSuper) {
                            foreach ($driveSteps as $attackerDrive) {
                                foreach (range(0, $this->defenderObjectMax) as $defenderObject) {
                                    yield $index++ => [
                                        'includeCornerSpecific' => $includeCornerSpecific,
                                        'attacker' => ['drive' => $attackerDrive * self::DRIVE_STEP, 'super' => (float) $attackerSuper, 'object' => $attackerObject],
                                        'defender' => ['drive' => $defenderDrive * self::DRIVE_STEP, 'super' => (float) $defenderSuper, 'object' => $defenderObject],
                                    ];
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
