<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\User;

class AuthenticatedUserPayloadFactory
{
    public function __construct(
        private readonly TermsAcceptanceService $termsAcceptanceService,
    ) {
    }

    /**
     * @return array{id: string|null, username: string, roles: array<string>, isActive: bool, hasAcceptedCurrentTerms: bool}
     */
    public function create(User $user): array
    {
        return [
            'id' => $user->getId()?->toRfc4122(),
            'username' => $user->getUsername(),
            'roles' => $user->getRoles(),
            'isActive' => $user->isActive(),
            'hasAcceptedCurrentTerms' => $this->termsAcceptanceService->hasAcceptedCurrentTerms($user),
        ];
    }
}
