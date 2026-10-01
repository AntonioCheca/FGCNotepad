<?php declare(strict_types=1);

namespace App\Service\Modern;

use App\Entity\User;
use App\Util\Enum\ComboExecutionMode;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/** An explicit executionMode on the request wins; otherwise the user's profile default; otherwise Classic. */
final class ComboExecutionModePreferenceService
{
    public const QUERY_KEY = 'executionMode';

    public function resolveForRequest(Request $request, ?User $user): ComboExecutionMode
    {
        $raw = $request->query->get(self::QUERY_KEY);
        if (is_string($raw) && '' !== trim($raw)) {
            return $this->parse($raw);
        }

        return $this->resolveForUser($user);
    }

    public function resolveForUser(?User $user): ComboExecutionMode
    {
        return $user?->getScenarioPreference()?->getComboExecutionMode() ?? ComboExecutionMode::CLASSIC;
    }

    public function parse(string $value): ComboExecutionMode
    {
        return ComboExecutionMode::fromNullable($value)
            ?? throw new BadRequestHttpException('executionMode must be classic, modern_max or modern_simple.');
    }
}
