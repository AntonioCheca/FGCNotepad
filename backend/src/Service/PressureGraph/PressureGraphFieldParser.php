<?php declare(strict_types=1);

namespace App\Service\PressureGraph;

use App\Util\Enum\PressureEdgeKind;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Validates the graph fields oki and blockstring payloads share: layer, edge kind, read label and node outcome.
 */
final class PressureGraphFieldParser
{
    public const MIN_LAYER = 1;
    public const MAX_LAYER = 3;
    public const READ_LABEL_MAX_LENGTH = 48;
    public const MAX_DAMAGE = 10000;

    public function layer(mixed $value): int
    {
        if (null === $value || '' === $value) {
            return self::MIN_LAYER;
        }
        if (!is_int($value) && !(is_string($value) && ctype_digit($value))) {
            throw new BadRequestHttpException('layer must be an integer.');
        }
        $layer = (int) $value;
        if ($layer < self::MIN_LAYER || $layer > self::MAX_LAYER) {
            throw new BadRequestHttpException(sprintf('layer must be between %d and %d.', self::MIN_LAYER, self::MAX_LAYER));
        }

        return $layer;
    }

    public function edgeKind(mixed $value): PressureEdgeKind
    {
        if (null === $value || '' === $value) {
            return PressureEdgeKind::NORMAL;
        }
        $kind = is_string($value) ? PressureEdgeKind::tryFrom($value) : null;
        if (null === $kind) {
            throw new BadRequestHttpException('kind must be one of normal, confirm, read or fake.');
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

    public function damage(mixed $value, string $field): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (!is_int($value) && !(is_string($value) && ctype_digit($value))) {
            throw new BadRequestHttpException(sprintf('%s must be a whole number.', $field));
        }
        $damage = (int) $value;
        if ($damage < 0 || $damage > self::MAX_DAMAGE) {
            throw new BadRequestHttpException(sprintf('%s must be between 0 and %d.', $field, self::MAX_DAMAGE));
        }

        return 0 === $damage ? null : $damage;
    }
}
