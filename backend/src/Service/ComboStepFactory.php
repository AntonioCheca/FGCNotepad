<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboSequences;
use App\Entity\ConnectionType;
use App\Entity\Step;
use App\Repository\ComboSequencesRepository;
use App\Repository\ConnectionTypeRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ComboStepFactory
{
    public function __construct(
        private ComboSequencesRepository $comboSequencesRepository,
        private ConnectionTypeRepository $connectionTypeRepository,
    ) {
    }

    /**
     * @param array<int, mixed> $stepsPayload
     *
     * @return array<int, Step>
     */
    public function createFromPayload(ComboSequences $parentSequence, array $stepsPayload): array
    {
        $steps = [];

        foreach ($stepsPayload as $index => $stepData) {
            if (!is_array($stepData)) {
                throw new BadRequestHttpException(sprintf('Step %d must be an object.', $index + 1));
            }

            $childSequenceId = $this->requirePositiveInteger($stepData, 'child_sequence_id', $index);
            $ordinalInCombo = $this->requirePositiveInteger($stepData, 'ordinal_in_combo', $index);

            $childSequence = $this->comboSequencesRepository->find($childSequenceId);
            if (!$childSequence instanceof ComboSequences) {
                throw new NotFoundHttpException(sprintf('Child sequence ID %d not found.', $childSequenceId));
            }

            $connectionType = $this->resolveConnectionType($stepData, $index);
            [$delayMinFrames, $delayMaxFrames, $delayMinUnverified, $delayMaxUnverified] = $this->resolveDelayWindow($stepData, $connectionType, $index);

            $step = new Step();
            $step
                ->setChildSequence($childSequence)
                ->setOrdinalInCombo($ordinalInCombo)
                ->setDelayMinFrames($delayMinFrames)
                ->setDelayMaxFrames($delayMaxFrames)
                ->setDelayMinUnverified($delayMinUnverified)
                ->setDelayMaxUnverified($delayMaxUnverified);

            if ($connectionType instanceof ConnectionType) {
                $step->setConnectionType($connectionType);
            }

            $parentSequence->addStep($step);

            $steps[] = $step;
        }

        return $steps;
    }

    /**
     * @param array<string, mixed> $stepData
     */
    private function resolveConnectionType(array $stepData, int $index): ?ConnectionType
    {
        if (!array_key_exists('connection_type_id', $stepData) || null === $stepData['connection_type_id'] || '' === $stepData['connection_type_id']) {
            return null;
        }

        $connectionTypeId = $this->requirePositiveInteger($stepData, 'connection_type_id', $index);
        $connectionType = $this->connectionTypeRepository->find($connectionTypeId);

        if (!$connectionType instanceof ConnectionType) {
            throw new NotFoundHttpException(sprintf('Connection type ID %d not found.', $connectionTypeId));
        }

        return $connectionType;
    }

    /**
     * @param array<string, mixed> $stepData
     *
     * @return array{0:int|null,1:int|null,2:bool,3:bool}
     */
    private function resolveDelayWindow(array $stepData, ?ConnectionType $connectionType, int $index): array
    {
        $hasDelayFrames = array_key_exists('delay_frames', $stepData) && null !== $stepData['delay_frames'] && '' !== $stepData['delay_frames'];
        $hasDelayMin = array_key_exists('delay_min_frames', $stepData) && null !== $stepData['delay_min_frames'] && '' !== $stepData['delay_min_frames'];
        $hasDelayMax = array_key_exists('delay_max_frames', $stepData) && null !== $stepData['delay_max_frames'] && '' !== $stepData['delay_max_frames'];
        $hasDelayMinUnverified = array_key_exists('delay_min_unverified', $stepData);
        $hasDelayMaxUnverified = array_key_exists('delay_max_unverified', $stepData);

        if (!$hasDelayFrames && !$hasDelayMin && !$hasDelayMax && !$hasDelayMinUnverified && !$hasDelayMaxUnverified) {
            return [null, null, false, false];
        }

        if (!$this->isDelayConnection($connectionType)) {
            throw new BadRequestHttpException(sprintf('Step %d cannot define delay frames unless connection type is Delay.', $index + 1));
        }

        $delayMinUnverified = $this->readOptionalBoolean($stepData, 'delay_min_unverified', $index);
        $delayMaxUnverified = $this->readOptionalBoolean($stepData, 'delay_max_unverified', $index);

        if ($hasDelayFrames && ($hasDelayMin || $hasDelayMax)) {
            throw new BadRequestHttpException(sprintf('Step %d must use delay_frames or delay_min_frames/delay_max_frames, but not both.', $index + 1));
        }

        if ($hasDelayFrames) {
            if ($hasDelayMinUnverified || $hasDelayMaxUnverified) {
                throw new BadRequestHttpException(sprintf('Step %d cannot define delay_min_unverified or delay_max_unverified when using delay_frames.', $index + 1));
            }

            $delayFrames = $this->readNonNegativeInteger($stepData['delay_frames'], 'delay_frames', $index);

            return [$delayFrames, $delayFrames, false, false];
        }

        if (!$hasDelayMin || !$hasDelayMax) {
            throw new BadRequestHttpException(sprintf('Step %d must provide both delay_min_frames and delay_max_frames.', $index + 1));
        }

        $delayMin = $this->readNonNegativeInteger($stepData['delay_min_frames'], 'delay_min_frames', $index);
        $delayMax = $this->readNonNegativeInteger($stepData['delay_max_frames'], 'delay_max_frames', $index);

        if ($delayMin > $delayMax) {
            throw new BadRequestHttpException(sprintf('Step %d has invalid delay window: min cannot be greater than max.', $index + 1));
        }

        return [$delayMin, $delayMax, $delayMinUnverified, $delayMaxUnverified];
    }

    private function isDelayConnection(?ConnectionType $connectionType): bool
    {
        if (!$connectionType instanceof ConnectionType) {
            return false;
        }

        $normalized = strtolower((string) $connectionType->getName());
        $normalized = preg_replace('/[^a-z0-9]/', '', $normalized) ?? $normalized;

        return 'delay' === $normalized;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function requirePositiveInteger(array $payload, string $field, int $index): int
    {
        if (!array_key_exists($field, $payload) || null === $payload[$field] || '' === $payload[$field]) {
            throw new BadRequestHttpException(sprintf('Step %d must define %s.', $index + 1, $field));
        }

        $raw = $payload[$field];

        if (is_int($raw)) {
            if ($raw <= 0) {
                throw new BadRequestHttpException(sprintf('Step %d field %s must be a positive integer.', $index + 1, $field));
            }

            return $raw;
        }

        if (is_string($raw) && ctype_digit($raw)) {
            $value = (int) $raw;
            if ($value <= 0) {
                throw new BadRequestHttpException(sprintf('Step %d field %s must be a positive integer.', $index + 1, $field));
            }

            return $value;
        }

        throw new BadRequestHttpException(sprintf('Step %d field %s must be a positive integer.', $index + 1, $field));
    }

    private function readNonNegativeInteger(mixed $raw, string $field, int $index): int
    {
        if (is_int($raw)) {
            if ($raw < 0) {
                throw new BadRequestHttpException(sprintf('Step %d field %s must be a non-negative integer.', $index + 1, $field));
            }

            return $raw;
        }

        if (is_string($raw) && ctype_digit($raw)) {
            return (int) $raw;
        }

        throw new BadRequestHttpException(sprintf('Step %d field %s must be a non-negative integer.', $index + 1, $field));
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function readOptionalBoolean(array $payload, string $field, int $index): bool
    {
        if (!array_key_exists($field, $payload)) {
            return false;
        }

        if (!is_bool($payload[$field])) {
            throw new BadRequestHttpException(sprintf('Step %d field %s must be a boolean.', $index + 1, $field));
        }

        return $payload[$field];
    }
}
