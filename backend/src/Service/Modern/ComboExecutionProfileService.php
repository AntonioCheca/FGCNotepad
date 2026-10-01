<?php declare(strict_types=1);

namespace App\Service\Modern;

use App\Entity\ComboMetrics;
use App\Entity\ComboSequences;
use App\Entity\Move;
use App\Entity\Step;
use App\Repository\CharacterModernAutoComboRepository;
use App\Service\StoredComboDamageEstimator;
use App\Util\Enum\ComboExecutionMode;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Stores what a combo is under each execution mode: whether it is Modern legal, and its Classic, Modern max and
 * Modern simple damage. One damage is known (observed or entered) in one mode; the others follow from it by the
 * estimator's difference between modes, so the known damage stays authoritative.
 */
final class ComboExecutionProfileService
{
    public function __construct(
        private readonly ModernComboLegalityValidator $legalityValidator,
        private readonly CharacterModernAutoComboRepository $autoComboRepository,
        private readonly StoredComboDamageEstimator $storedComboDamageEstimator,
    ) {
    }

    /** @param ComboExecutionMode $knownDamageMode the mode the combo's stored damage was observed or entered in */
    public function apply(ComboSequences $sequence, ComboExecutionMode $knownDamageMode = ComboExecutionMode::CLASSIC): void
    {
        $steps = $this->orderedSteps($sequence);
        $moves = $this->moves($sequence, $steps);
        $legal = [] !== $moves && $this->legalityValidator->isLegal($moves, $this->autoCombos($sequence));
        $sequence->setModernLegal($legal);

        $metrics = $sequence->getComboMetrics();
        if (!$metrics instanceof ComboMetrics || null === $metrics->getDamage()) {
            return;
        }

        $estimates = $this->estimatesByMode($sequence, $steps);
        $classicDamage = max(0, $metrics->getDamage() - $estimates[$knownDamageMode->value] + $estimates[ComboExecutionMode::CLASSIC->value]);
        $metrics
            ->setDamage($classicDamage)
            ->setModernMaxDamage($legal ? $this->damageIn(ComboExecutionMode::MODERN_MAX, $classicDamage, $estimates) : null)
            ->setModernSimpleDamage($legal ? $this->damageIn(ComboExecutionMode::MODERN_SIMPLE, $classicDamage, $estimates) : null);
    }

    /**
     * Damage is Classic unless the payload says it was seen in a Modern execution mode.
     *
     * @param array<string, mixed> $payload
     */
    public function knownDamageMode(array $payload): ComboExecutionMode
    {
        $value = is_array($payload['metrics'] ?? null) ? ($payload['metrics']['damageExecutionMode'] ?? null) : null;
        if (null === $value) {
            return ComboExecutionMode::CLASSIC;
        }

        $mode = is_string($value) ? ComboExecutionMode::fromNullable($value) : null;
        if (null === $mode) {
            throw new BadRequestHttpException('metrics.damageExecutionMode must be classic, modern_max or modern_simple.');
        }

        return $mode;
    }

    /** @param array<string, int> $estimates */
    private function damageIn(ComboExecutionMode $mode, int $classicDamage, array $estimates): int
    {
        return max(0, $classicDamage + $estimates[$mode->value] - $estimates[ComboExecutionMode::CLASSIC->value]);
    }

    /**
     * @param list<Step> $steps
     *
     * @return array<string, int>
     */
    private function estimatesByMode(ComboSequences $sequence, array $steps): array
    {
        $penalized = $this->hasSimpleInputPenalty($steps);
        $estimates = [];
        foreach (ComboExecutionMode::cases() as $mode) {
            $estimates[$mode->value] = $penalized ? $this->storedComboDamageEstimator->estimate($sequence, $mode)['estimatedDamage'] : 0;
        }

        return $estimates;
    }

    /**
     * Without a simple-input damage penalty every mode deals the same damage and nothing needs estimating.
     *
     * @param list<Step> $steps
     */
    private function hasSimpleInputPenalty(array $steps): bool
    {
        foreach ($steps as $step) {
            if (null !== $step->getChildSequence()?->getMove()?->getModernSimpleDamagePercent()) {
                return true;
            }
        }

        return false;
    }

    /** @return list<Step> */
    private function orderedSteps(ComboSequences $sequence): array
    {
        $steps = array_values($sequence->getSteps()->toArray());
        usort($steps, static fn (Step $left, Step $right): int => ($left->getOrdinalInCombo() ?? 0) <=> ($right->getOrdinalInCombo() ?? 0));

        return $steps;
    }

    /**
     * A leaf is its own single move; a combo is its steps' moves, and a step without a move makes it unverifiable.
     *
     * @param list<Step> $steps
     *
     * @return list<Move>
     */
    private function moves(ComboSequences $sequence, array $steps): array
    {
        if ([] === $steps) {
            return $sequence->getMove() instanceof Move ? [$sequence->getMove()] : [];
        }

        $moves = [];
        foreach ($steps as $step) {
            $move = $step->getChildSequence()?->getMove();
            if (!$move instanceof Move) {
                return [];
            }
            $moves[] = $move;
        }

        return $moves;
    }

    /** @return list<list<Move>> */
    private function autoCombos(ComboSequences $sequence): array
    {
        $character = $sequence->getCharacter();
        if (null === $character) {
            return [];
        }

        $autoCombos = [];
        foreach ($this->autoComboRepository->findByCharacter($character) as $autoCombo) {
            $autoCombos[] = $this->moves($autoCombo->getCombo(), $this->orderedSteps($autoCombo->getCombo()));
        }

        return $autoCombos;
    }
}
