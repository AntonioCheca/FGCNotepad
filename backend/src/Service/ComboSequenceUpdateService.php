<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\RequirementSpecificCharacter;
use App\Entity\Step;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class ComboSequenceUpdateService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ComboRequirementFactory $comboRequirementFactory,
        private readonly ComboStepFactory $comboStepFactory,
        private readonly ComboValueEstimator $comboValueEstimator,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function updateFromPayload(ComboSequences $sequence, array $payload): ComboSequences
    {
        if (isset($payload['type'])) {
            throw new BadRequestHttpException('Cannot change type of ComboSequence');
        }

        if (array_key_exists('name', $payload)) {
            if (!is_string($payload['name']) || '' === trim($payload['name'])) {
                throw new BadRequestHttpException('name must be a non-empty string.');
            }

            $sequence->setName($payload['name']);
        }

        if (array_key_exists('description', $payload)) {
            if (null !== $payload['description'] && !is_string($payload['description'])) {
                throw new BadRequestHttpException('description must be a string.');
            }

            $sequence->setDescription((string) ($payload['description'] ?? ''));
        }

        if (array_key_exists('metrics', $payload)) {
            $this->replaceMetrics($sequence, $payload['metrics']);
        }

        if (array_key_exists('requirements', $payload)) {
            $this->replaceRequirements($sequence, $payload['requirements']);
        }

        if (array_key_exists('steps', $payload)) {
            if (!is_array($payload['steps']) || [] === $payload['steps']) {
                throw new BadRequestHttpException('steps must be a non-empty array.');
            }

            $this->replaceSteps($sequence, $payload['steps']);
        }

        return $sequence;
    }

    private function replaceMetrics(ComboSequences $sequence, mixed $metricsPayload): void
    {
        if (!is_array($metricsPayload) || !array_key_exists('damage', $metricsPayload)) {
            throw new BadRequestHttpException('metrics.damage is required.');
        }

        $damage = $this->readInteger($metricsPayload['damage'], 'metrics.damage');
        $metrics = $sequence->getComboMetrics();
        if (!$metrics instanceof ComboMetrics) {
            $metrics = new ComboMetrics();
            $sequence->setComboMetrics($metrics);
            $this->entityManager->persist($metrics);
        }

        $metrics
            ->setDamage($damage)
            ->setDriveCost($this->readNullableFloat($metricsPayload['driveCost'] ?? null, 'metrics.driveCost'))
            ->setDriveGain($this->readNullableFloat($metricsPayload['driveGain'] ?? null, 'metrics.driveGain'))
            ->setSuperCost($this->readNullableFloat($metricsPayload['superCost'] ?? null, 'metrics.superCost'))
            ->setSuperGain($this->readNullableFloat($metricsPayload['superGain'] ?? null, 'metrics.superGain'));

        $this->comboValueEstimator->applyEstimatedValue($metrics);
    }

    private function replaceRequirements(ComboSequences $sequence, mixed $requirementsPayload): void
    {
        if (!is_array($requirementsPayload)) {
            throw new BadRequestHttpException('requirements must be an object.');
        }

        try {
            $nextRequirement = $this->comboRequirementFactory->createFromPayload($sequence, $requirementsPayload);
        } catch (InvalidArgumentException $exception) {
            throw new BadRequestHttpException($exception->getMessage(), $exception);
        }

        $existingRequirement = $sequence->getComboRequirement();
        if (!$existingRequirement instanceof ComboRequirement) {
            if ($nextRequirement instanceof ComboRequirement) {
                $sequence->setComboRequirement($nextRequirement);
                $this->entityManager->persist($nextRequirement);
            }

            return;
        }

        if (!$nextRequirement instanceof ComboRequirement) {
            $existingRequirement
                ->setCounterHitRequired(false)
                ->setPunishCounterRequired(false)
                ->setCornerRequired(false)
                ->setAirborneRequired(false)
                ->setMidScreenRequired(false)
                ->setNotCrouchingRequired(false);
            $existingRequirement->getRequirementSpecificCharacters()->clear();

            return;
        }

        $existingRequirement
            ->setCounterHitRequired((bool) $nextRequirement->isCounterHitRequired())
            ->setPunishCounterRequired((bool) $nextRequirement->isPunishCounterRequired())
            ->setCornerRequired((bool) $nextRequirement->isCornerRequired())
            ->setAirborneRequired((bool) $nextRequirement->isAirborneRequired())
            ->setMidScreenRequired((bool) $nextRequirement->isMidScreenRequired())
            ->setNotCrouchingRequired((bool) $nextRequirement->isNotCrouchingRequired());

        $existingRequirement->getRequirementSpecificCharacters()->clear();
        $nextSpecificRequirement = $nextRequirement->getRequirementSpecificCharacter();
        if ($nextSpecificRequirement instanceof RequirementSpecificCharacter) {
            $existingRequirement->setRequirementSpecificCharacter($nextSpecificRequirement);
            $this->entityManager->persist($nextSpecificRequirement);
        }
    }

    /**
     * @param array<int, mixed> $stepsPayload
     */
    private function replaceSteps(ComboSequences $sequence, array $stepsPayload): void
    {
        foreach ($sequence->getSteps()->toArray() as $step) {
            if ($step instanceof Step) {
                $sequence->removeStep($step);
                $this->entityManager->remove($step);
            }
        }

        foreach ($this->comboStepFactory->createFromPayload($sequence, $stepsPayload) as $step) {
            $this->entityManager->persist($step);
        }
    }

    private function readInteger(mixed $value, string $field): int
    {
        if (is_int($value)) {
            return $value;
        }

        if (is_string($value) && preg_match('/^-?\d+$/', trim($value))) {
            return (int) trim($value);
        }

        throw new BadRequestHttpException(sprintf('%s must be an integer.', $field));
    }

    private function readNullableFloat(mixed $value, string $field): ?float
    {
        if (null === $value || '' === $value) {
            return null;
        }

        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (is_string($value) && is_numeric(trim($value))) {
            return (float) trim($value);
        }

        throw new BadRequestHttpException(sprintf('%s must be numeric.', $field));
    }
}
