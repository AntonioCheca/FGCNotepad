<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\RegistrationInviteCode;
use App\Repository\RegistrationInviteCodeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Uid\Uuid;

class RegistrationInviteCodeService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly RegistrationInviteCodeRepository $inviteCodeRepository,
    ) {
    }

    /**
     * @return array{code: string, inviteCode: RegistrationInviteCode}
     */
    public function createInviteCode(?string $label = null): array
    {
        $code = sprintf('fgt-alpha-%s', Uuid::v4()->toRfc4122());
        $inviteCode = new RegistrationInviteCode();
        $inviteCode->setCodeHash($this->hashCode($code));
        $inviteCode->setLabel($label);

        $this->entityManager->persist($inviteCode);
        $this->entityManager->flush();

        return ['code' => $code, 'inviteCode' => $inviteCode];
    }

    public function findUnusedInviteCode(?string $plainCode): ?RegistrationInviteCode
    {
        if (!is_string($plainCode) || '' === trim($plainCode)) {
            return null;
        }

        return $this->inviteCodeRepository->findUnusedByCodeHash($this->hashCode(trim($plainCode)));
    }

    public function hashCode(string $plainCode): string
    {
        return hash('sha256', trim($plainCode));
    }
}
