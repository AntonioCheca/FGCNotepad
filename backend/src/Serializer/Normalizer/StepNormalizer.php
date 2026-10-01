<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\Move;
use App\Entity\Step;
use App\Service\Modern\ComboExecutionNotationService;
use App\Util\Enum\ComboExecutionMode;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class StepNormalizer implements NormalizerInterface
{
    public function __construct(private readonly ComboExecutionNotationService $executionNotationService)
    {
    }

    /**
     * @param array<string, mixed> $context
     * @return array<string, mixed>
     */
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var Step $object */
        $childSequence = $object->getChildSequence();
        $connectionType = $object->getConnectionType();
        $move = $childSequence?->getMove();
        $mode = $context[ComboExecutionMode::class] ?? ComboExecutionMode::CLASSIC;

        return [
            'id' => $object->getId(),
            'parent_sequence_id' => $object->getParentSequence()?->getId(),
            'child_sequence_id' => $childSequence?->getId(),
            'child_sequence_name' => $childSequence?->getName(),
            'child_sequence_notation' => $move instanceof Move ? $this->executionNotationService->stepNotation($move, $mode) : null,
            'ordinal_in_combo' => $object->getOrdinalInCombo(),
            'connection_type_id' => $connectionType?->getId(),
            'connection_type_name' => $connectionType?->getName(),
            'delay_min_frames' => $object->getDelayMinFrames(),
            'delay_max_frames' => $object->getDelayMaxFrames(),
            'delay_min_unverified' => $object->isDelayMinUnverified(),
            'delay_max_unverified' => $object->isDelayMaxUnverified(),
        ];
    }

    /** @param array<string, mixed> $context */
    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Step;
    }

    /** @return array<class-string, bool> */
    public function getSupportedTypes(?string $format): array
    {
        return [
            Step::class => true,
        ];
    }
}
