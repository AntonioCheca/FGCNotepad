<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class EndpointAuthorizationService
{
    public function __construct(
        private readonly AuthorizationPolicyService $authorizationPolicyService,
    ) {
    }

    public function requireAuthenticatedUser(mixed $securityUser, string $message = 'Authentication required.'): User
    {
        if (!$securityUser instanceof User) {
            throw new UnauthorizedHttpException('Session', $message);
        }

        return $securityUser;
    }

    public function assertCanMutateOwnedContent(User $actor, ?User $owner, string $message = 'Forbidden'): void
    {
        $canMutate = $this->authorizationPolicyService->canEditOwnContent($actor, $owner)
            || $this->authorizationPolicyService->canEditAnyContent($actor);

        if (!$canMutate) {
            throw new AccessDeniedHttpException($message);
        }
    }

    public function assertCanManageEssentialFlag(User $actor, string $message = 'Forbidden'): void
    {
        if (!$this->authorizationPolicyService->canModerateContent($actor)) {
            throw new AccessDeniedHttpException($message);
        }
    }

    public function assertCanModerateContent(User $actor, string $message = 'Forbidden'): void
    {
        if (!$this->authorizationPolicyService->canModerateContent($actor)) {
            throw new AccessDeniedHttpException($message);
        }
    }

    public function assertCanManageUsers(User $actor, string $message = 'Forbidden'): void
    {
        if (!$this->authorizationPolicyService->canManageUsers($actor)) {
            throw new AccessDeniedHttpException($message);
        }
    }
}
