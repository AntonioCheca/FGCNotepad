<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ReplayReviewAccessToken;
use App\Entity\ReplayReviewSession;
use App\Entity\User;
use App\Repository\ReplayReviewAccessTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ReplayReviewAccessTokenService
{
    public function __construct(
        private readonly ReplayReviewAccessTokenRepository $tokenRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return array{accessToken: ReplayReviewAccessToken, plainToken: string}
     */
    public function create(ReplayReviewSession $session, User $creator, array $payload): array
    {
        $plainToken = bin2hex(random_bytes(32));
        $password = $payload['password'] ?? null;

        $accessToken = (new ReplayReviewAccessToken())
            ->setSession($session)
            ->setCreatedByUser($creator)
            ->setTokenHash($this->hashToken($plainToken))
            ->setLabel($this->optionalString($payload['label'] ?? null))
            ->setPasswordHash(is_string($password) && '' !== trim($password) ? password_hash($password, PASSWORD_BCRYPT) : null)
            ->setExpiresAt($this->parseOptionalDate($payload['expiresAt'] ?? null))
            ->setMaxUses($this->parseOptionalPositiveInt($payload['maxUses'] ?? null, 'maxUses'))
            ->setCanView($this->optionalBool($payload['canView'] ?? null, true))
            ->setCanAnnotate($this->optionalBool($payload['canAnnotate'] ?? null, true));

        if (!$accessToken->canView() && !$accessToken->canAnnotate()) {
            throw new BadRequestHttpException('Share link must allow view or annotate.');
        }

        $this->entityManager->persist($accessToken);
        $this->entityManager->flush();

        return ['accessToken' => $accessToken, 'plainToken' => $plainToken];
    }

    public function revoke(ReplayReviewAccessToken $accessToken, User $actor): ReplayReviewAccessToken
    {
        if ($accessToken->getSession()?->getOwnerUser() !== $actor) {
            throw new AccessDeniedHttpException('Share link not accessible.');
        }

        $accessToken->setRevokedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return $accessToken;
    }

    public function validatePlainToken(string $plainToken, bool $requiresAnnotate = false, ?string $password = null): ReplayReviewAccessToken
    {
        $accessToken = $this->tokenRepository->findOneBy(['tokenHash' => $this->hashToken($plainToken)]);
        if (!$accessToken instanceof ReplayReviewAccessToken) {
            throw new NotFoundHttpException('Shared review link not found.');
        }

        $now = new \DateTimeImmutable();
        if (null !== $accessToken->getRevokedAt()) {
            throw new AccessDeniedHttpException('Shared review link was revoked.');
        }

        if (null !== $accessToken->getExpiresAt() && $accessToken->getExpiresAt() <= $now) {
            throw new AccessDeniedHttpException('Shared review link has expired.');
        }

        if (null !== $accessToken->getMaxUses() && $accessToken->getUsedCount() >= $accessToken->getMaxUses()) {
            throw new AccessDeniedHttpException('Shared review link usage limit reached.');
        }

        if (!$accessToken->canView()) {
            throw new AccessDeniedHttpException('Shared review link cannot view this session.');
        }

        if ($requiresAnnotate && !$accessToken->canAnnotate()) {
            throw new AccessDeniedHttpException('Shared review link cannot annotate this session.');
        }

        $passwordHash = $accessToken->getPasswordHash();
        if (null !== $passwordHash && !password_verify((string) $password, $passwordHash)) {
            throw new AccessDeniedHttpException('Shared review password is required.');
        }

        $accessToken->incrementUsedCount();
        $this->entityManager->flush();

        return $accessToken;
    }

    /**
     * @return array<string, mixed>
     */
    public function response(ReplayReviewAccessToken $accessToken, ?string $plainToken = null): array
    {
        $payload = [
            'id' => (string) $accessToken->getId(),
            'sessionId' => (string) $accessToken->getSession()?->getId(),
            'label' => $accessToken->getLabel(),
            'expiresAt' => $accessToken->getExpiresAt()?->format(\DateTimeInterface::ATOM),
            'maxUses' => $accessToken->getMaxUses(),
            'usedCount' => $accessToken->getUsedCount(),
            'canView' => $accessToken->canView(),
            'canAnnotate' => $accessToken->canAnnotate(),
            'requiresPassword' => null !== $accessToken->getPasswordHash(),
            'createdAt' => $accessToken->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'revokedAt' => $accessToken->getRevokedAt()?->format(\DateTimeInterface::ATOM),
        ];

        if (null !== $plainToken) {
            $payload['token'] = $plainToken;
        }

        return $payload;
    }

    private function hashToken(string $plainToken): string
    {
        return hash('sha256', trim($plainToken));
    }

    private function optionalString(mixed $value): ?string
    {
        if (null === $value) {
            return null;
        }
        if (!is_string($value)) {
            throw new BadRequestHttpException('Optional text values must be strings.');
        }

        $trimmed = trim($value);

        return '' === $trimmed ? null : $trimmed;
    }

    private function optionalBool(mixed $value, bool $default): bool
    {
        if (null === $value) {
            return $default;
        }
        if (!is_bool($value)) {
            throw new BadRequestHttpException('Permission values must be boolean.');
        }

        return $value;
    }

    private function parseOptionalDate(mixed $value): ?\DateTimeImmutable
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (!is_string($value)) {
            throw new BadRequestHttpException('expiresAt must be an ISO date string or null.');
        }

        try {
            return new \DateTimeImmutable($value);
        } catch (\Throwable) {
            throw new BadRequestHttpException('expiresAt must be a valid date.');
        }
    }

    private function parseOptionalPositiveInt(mixed $value, string $field): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (!is_int($value) && !(is_string($value) && preg_match('/^\d+$/', $value))) {
            throw new BadRequestHttpException(sprintf('%s must be a positive integer or null.', $field));
        }

        $parsed = (int) $value;
        if ($parsed <= 0) {
            throw new BadRequestHttpException(sprintf('%s must be greater than zero.', $field));
        }

        return $parsed;
    }
}
