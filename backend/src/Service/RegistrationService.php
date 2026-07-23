<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Entity\RegistrationInviteCode;
use App\Repository\UserRepository;
use App\Util\Enum\UserRole;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class RegistrationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function register(string $username, string $plainPassword, ?RegistrationInviteCode $inviteCode = null): User
    {
        $normalizedUsername = trim($username);
        if ('' === $normalizedUsername) {
            throw new \InvalidArgumentException('Username is required.');
        }

        if ('' === trim($plainPassword)) {
            throw new \InvalidArgumentException('Password is required.');
        }

        $existingUser = $this->userRepository->findOneBy(['username' => $normalizedUsername]);
        if (null !== $existingUser) {
            throw new ConflictHttpException('User already exists.');
        }

        $user = new User();
        $user->setUsername($normalizedUsername);
        $user->setPassword($this->passwordHasher->hashPassword($user, $plainPassword));
        $user->setRoles([UserRole::USER->value]);

        if (null !== $inviteCode) {
            $inviteCode->markUsedBy($user);
        }

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }
}
