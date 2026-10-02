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
    private const USERNAME_MIN_LENGTH = 3;
    private const USERNAME_MAX_LENGTH = 40;
    private const PASSWORD_MIN_LENGTH = 8;
    private const PASSWORD_MAX_LENGTH = 4096;
    private const USERNAME_PATTERN = '/^[A-Za-z0-9_.-]{3,40}$/';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function register(string $username, string $plainPassword, ?RegistrationInviteCode $inviteCode = null): User
    {
        $normalizedUsername = trim($username);
        if (1 !== preg_match(self::USERNAME_PATTERN, $normalizedUsername)) {
            throw new \InvalidArgumentException(sprintf(
                'Username must be %d to %d characters using letters, numbers, dots, dashes or underscores.',
                self::USERNAME_MIN_LENGTH,
                self::USERNAME_MAX_LENGTH,
            ));
        }

        $passwordLength = mb_strlen($plainPassword);
        if ($passwordLength < self::PASSWORD_MIN_LENGTH || $passwordLength > self::PASSWORD_MAX_LENGTH) {
            throw new \InvalidArgumentException(sprintf('Password must be at least %d characters.', self::PASSWORD_MIN_LENGTH));
        }

        if (null !== $this->userRepository->findOneByUsernameCaseInsensitive($normalizedUsername)) {
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
