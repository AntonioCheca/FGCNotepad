<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Util\Enum\UserRole;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class AdminUserManagementService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @param list<string> $rawRoles
     *
     * @return list<string>
     */
    public function updateUserRoles(User $target, array $rawRoles): array
    {
        $normalizedRoles = $this->normalizeRoles($rawRoles);

        $targetWasAdmin = $this->hasAdminRole($target->getRoles());
        $targetWillBeAdmin = $this->hasAdminRole($normalizedRoles);
        if ($targetWasAdmin && !$targetWillBeAdmin) {
            $this->assertCanRemoveAdminPrivileges($target);
        }

        $target->setRoles($normalizedRoles);
        $this->entityManager->flush();

        return $target->getRoles();
    }

    public function deactivateUser(User $target): void
    {
        if (!$target->isActive()) {
            throw new ConflictHttpException('User account is already deactivated.');
        }

        if ($this->hasAdminRole($target->getRoles())) {
            $this->assertCanRemoveAdminPrivileges($target);
        }

        $target->setIsActive(false);
        $target->setDeactivatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();
    }

    /**
     * @param list<string> $rawRoles
     *
     * @return list<string>
     */
    private function normalizeRoles(array $rawRoles): array
    {
        $normalized = [UserRole::USER->value => UserRole::USER->value];

        foreach ($rawRoles as $rawRole) {
            if (!is_string($rawRole)) {
                throw new BadRequestHttpException('roles must contain only strings.');
            }

            $candidate = trim(mb_strtoupper($rawRole));
            if ('' === $candidate) {
                continue;
            }

            $roleEnum = UserRole::tryFrom($candidate);
            if (null === $roleEnum) {
                throw new BadRequestHttpException(sprintf('Invalid role: %s', $rawRole));
            }

            $normalized[$roleEnum->value] = $roleEnum->value;
        }

        $roles = array_values($normalized);
        sort($roles);

        return $roles;
    }

    /**
     * @param list<string> $roles
     */
    private function hasAdminRole(array $roles): bool
    {
        return in_array(UserRole::ADMIN->value, $roles, true);
    }

    private function assertCanRemoveAdminPrivileges(User $target): void
    {
        $activeAdmins = $this->userRepository->countActiveAdmins();
        if ($activeAdmins <= 1 && $target->isActive()) {
            throw new ConflictHttpException('Operation blocked: cannot remove privileges from the last active admin.');
        }
    }
}
