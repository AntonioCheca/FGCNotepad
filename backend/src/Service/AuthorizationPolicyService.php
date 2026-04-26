<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Util\Enum\UserRole;

class AuthorizationPolicyService
{
    public function canEditOwnContent(?User $actor, ?User $owner): bool
    {
        if (null === $actor || null === $owner) {
            return false;
        }

        if ($actor === $owner) {
            return true;
        }

        $actorId = $actor->getId();
        $ownerId = $owner->getId();

        if (null === $actorId || null === $ownerId) {
            return false;
        }

        return $actorId->equals($ownerId);
    }

    public function canEditAnyContent(?User $actor): bool
    {
        if (null === $actor) {
            return false;
        }

        return $this->hasRole($actor, UserRole::MODERATOR) || $this->hasRole($actor, UserRole::ADMIN);
    }

    public function canModerateContent(?User $actor): bool
    {
        return $this->canEditAnyContent($actor);
    }

    public function canManageUsers(?User $actor): bool
    {
        if (null === $actor) {
            return false;
        }

        return $this->hasRole($actor, UserRole::ADMIN);
    }

    private function hasRole(User $actor, UserRole $role): bool
    {
        return in_array($role->value, $actor->getRoles(), true);
    }
}
