<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboSpacing;
use App\Repository\ComboSpacingRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class ComboSpacingResolver
{
    public function __construct(private readonly ComboSpacingRepository $comboSpacingRepository)
    {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function resolveFromPayload(array $payload): ?ComboSpacing
    {
        if (array_key_exists('spacingId', $payload)) {
            return $this->resolveById($payload['spacingId'], 'spacingId');
        }

        if (array_key_exists('spacingCode', $payload)) {
            return $this->resolveByCode($payload['spacingCode'], 'spacingCode');
        }

        if (!array_key_exists('spacing', $payload)) {
            return null;
        }

        $spacing = $payload['spacing'];
        if (null === $spacing || '' === $spacing) {
            return null;
        }

        if (is_int($spacing) || is_string($spacing)) {
            return is_numeric((string) $spacing)
                ? $this->resolveById($spacing, 'spacing')
                : $this->resolveByCode($spacing, 'spacing');
        }

        if (!is_array($spacing)) {
            throw new BadRequestHttpException('spacing must be null, an ID, a code, or an object with id/code.');
        }

        if (array_key_exists('id', $spacing)) {
            return $this->resolveById($spacing['id'], 'spacing.id');
        }

        if (array_key_exists('code', $spacing)) {
            return $this->resolveByCode($spacing['code'], 'spacing.code');
        }

        throw new BadRequestHttpException('spacing must include id or code.');
    }

    private function resolveById(mixed $value, string $field): ?ComboSpacing
    {
        if (null === $value || '' === $value) {
            return null;
        }

        if (!is_int($value) && !(is_string($value) && preg_match('/^\d+$/', trim($value)))) {
            throw new BadRequestHttpException(sprintf('%s must be a positive integer or null.', $field));
        }

        $id = (int) $value;
        if ($id <= 0) {
            throw new BadRequestHttpException(sprintf('%s must be a positive integer or null.', $field));
        }

        $spacing = $this->comboSpacingRepository->find($id);
        if (!$spacing instanceof ComboSpacing) {
            throw new BadRequestHttpException(sprintf('%s does not reference an existing spacing option.', $field));
        }

        return $spacing;
    }

    private function resolveByCode(mixed $value, string $field): ?ComboSpacing
    {
        if (null === $value || '' === $value) {
            return null;
        }

        if (!is_string($value)) {
            throw new BadRequestHttpException(sprintf('%s must be a spacing code or null.', $field));
        }

        $code = trim($value);
        if ('' === $code) {
            return null;
        }

        $spacing = $this->comboSpacingRepository->findOneBy(['code' => $code]);
        if (!$spacing instanceof ComboSpacing) {
            throw new BadRequestHttpException(sprintf('%s does not reference an existing spacing option.', $field));
        }

        return $spacing;
    }
}
