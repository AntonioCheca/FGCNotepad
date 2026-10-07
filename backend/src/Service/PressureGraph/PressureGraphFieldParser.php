<?php declare(strict_types=1);

namespace App\Service\PressureGraph;

use App\Util\Enum\PressureEdgeKind;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Validates the graph fields oki and blockstring payloads share: edge kind and read label.
 */
final class PressureGraphFieldParser
{
    public const READ_LABEL_MAX_LENGTH = 48;

    /**
     * Oki has no fake arrows, so callers pass the kinds their graph allows.
     *
     * @param list<PressureEdgeKind>|null $allowed
     */
    public function edgeKind(mixed $value, ?array $allowed = null): PressureEdgeKind
    {
        $allowed ??= PressureEdgeKind::cases();
        if (null === $value || '' === $value) {
            return PressureEdgeKind::NORMAL;
        }
        $kind = is_string($value) ? PressureEdgeKind::tryFrom($value) : null;
        if (null === $kind || !in_array($kind, $allowed, true)) {
            throw new BadRequestHttpException(sprintf('kind must be one of %s.', implode(', ', array_map(static fn (PressureEdgeKind $allowedKind): string => $allowedKind->value, $allowed))));
        }

        return $kind;
    }

    /**
     * Short "expects mash" style text; only hard reads carry it.
     */
    public function readLabel(mixed $value, PressureEdgeKind $kind): ?string
    {
        if (PressureEdgeKind::READ !== $kind || null === $value) {
            return null;
        }
        if (!is_string($value)) {
            throw new BadRequestHttpException('readLabel must be a string.');
        }
        $label = trim($value);
        if (mb_strlen($label) > self::READ_LABEL_MAX_LENGTH) {
            throw new BadRequestHttpException(sprintf('readLabel must be at most %d characters.', self::READ_LABEL_MAX_LENGTH));
        }

        return '' === $label ? null : $label;
    }
}
