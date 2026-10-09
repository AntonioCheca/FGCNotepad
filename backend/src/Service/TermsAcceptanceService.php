<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class TermsAcceptanceService
{
    // Must match TERMS_VERSION in frontend/src/data/legal/legalVersion.ts; bumping it asks every user to accept again.
    public const CURRENT_VERSION = '2026-10-09';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function recordAcceptance(User $user): void
    {
        $user->acceptTerms(self::CURRENT_VERSION, new \DateTimeImmutable());
    }

    public function acceptCurrentTerms(User $user): void
    {
        $this->recordAcceptance($user);
        $this->entityManager->flush();
    }

    public function hasAcceptedCurrentTerms(User $user): bool
    {
        return self::CURRENT_VERSION === $user->getTermsVersion();
    }
}
