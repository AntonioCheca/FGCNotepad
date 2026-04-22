<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Repository\UserComboRepository;

class ScenarioExecutionModeService
{
    public const MODE_MY_KNOWLEDGE = 'my_knowledge';
    public const MODE_STANDARD = 'standard';
    public const MODE_DIFFICULTY_CAP = 'difficulty_cap';

    public const STANDARD_MAX_DIFFICULTY = 5;
    public const DEFAULT_DIFFICULTY_CAP = 3;

    public function __construct(
        private readonly UserComboRepository $userComboRepository,
    ) {
    }

    public function normalizeMode(?string $mode, bool $isAuthenticated): string
    {
        $normalized = is_string($mode) ? trim(mb_strtolower($mode)) : '';
        $allowed = [
            self::MODE_MY_KNOWLEDGE,
            self::MODE_STANDARD,
            self::MODE_DIFFICULTY_CAP,
        ];

        if (!in_array($normalized, $allowed, true)) {
            return self::MODE_STANDARD;
        }

        if (self::MODE_MY_KNOWLEDGE === $normalized && !$isAuthenticated) {
            return self::MODE_STANDARD;
        }

        return $normalized;
    }

    public function normalizeDifficultyCap(mixed $value): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }

        if (!is_int($value) && !is_string($value) && !is_float($value)) {
            return null;
        }

        if (!is_numeric((string) $value)) {
            return null;
        }

        $normalized = (int) $value;

        if ($normalized < 1) {
            return null;
        }

        return $normalized;
    }

    /**
     * @return array{mode:string,allowedComboIds:list<int>|null,maxDifficulty:int|null,includeUnratedDifficulty:bool,difficultyCap:int|null}
     */
    public function resolveComboFilter(?User $user, string $characterId, ?string $requestedMode, ?int $requestedDifficultyCap): array
    {
        $mode = $this->normalizeMode($requestedMode, null !== $user);

        if (self::MODE_MY_KNOWLEDGE === $mode && null !== $user) {
            $userId = $user->getId();
            if (null === $userId) {
                return [
                    'mode' => self::MODE_STANDARD,
                    'allowedComboIds' => null,
                    'maxDifficulty' => self::STANDARD_MAX_DIFFICULTY,
                    'includeUnratedDifficulty' => true,
                    'difficultyCap' => null,
                ];
            }

            $knownComboIds = $this->userComboRepository->findKnownComboIdsByUserAndCharacterId(
                $userId,
                $characterId
            );

            return [
                'mode' => $mode,
                'allowedComboIds' => $knownComboIds,
                'maxDifficulty' => null,
                'includeUnratedDifficulty' => false,
                'difficultyCap' => null,
            ];
        }

        if (self::MODE_DIFFICULTY_CAP === $mode) {
            $difficultyCap = $requestedDifficultyCap ?? self::DEFAULT_DIFFICULTY_CAP;

            return [
                'mode' => $mode,
                'allowedComboIds' => null,
                'maxDifficulty' => $difficultyCap,
                'includeUnratedDifficulty' => false,
                'difficultyCap' => $difficultyCap,
            ];
        }

        return [
            'mode' => self::MODE_STANDARD,
            'allowedComboIds' => null,
            'maxDifficulty' => self::STANDARD_MAX_DIFFICULTY,
            'includeUnratedDifficulty' => true,
            'difficultyCap' => null,
        ];
    }
}
