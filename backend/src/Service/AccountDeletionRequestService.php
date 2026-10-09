<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class AccountDeletionRequestService
{
    public function __construct(
        private readonly AdminUserManagementService $adminUserManagementService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function requestDeletion(User $user): void
    {
        $this->adminUserManagementService->deactivateUser($user);
        $user->setDeletionRequestedAt(new \DateTimeImmutable());
        $this->entityManager->flush();
    }
}
