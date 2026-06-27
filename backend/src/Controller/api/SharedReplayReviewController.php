<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ReplayAnnotation;
use App\Entity\ReplayReviewSession;
use App\Entity\User;
use App\Service\ReplayLabCategoryCatalog;
use App\Service\ReplayMediaResponseFactory;
use App\Service\ReplayLabResponseBuilder;
use App\Service\ReplayReviewAccessTokenService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Annotation\Route;

final class SharedReplayReviewController extends AbstractController
{
    public function __construct(
        private readonly ReplayReviewAccessTokenService $accessTokenService,
        private readonly ReplayLabCategoryCatalog $categoryCatalog,
        private readonly ReplayMediaResponseFactory $mediaResponseFactory,
        private readonly ReplayLabResponseBuilder $responseBuilder,
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
        private readonly RequestStack $requestStack,
    ) {
    }

    #[Route('/api/shared-review/{token}', name: 'api_shared_replay_review_read', methods: ['GET'])]
    public function read(string $token): JsonResponse
    {
        $accessToken = $this->accessTokenService->validatePlainToken($token, false, $this->sharedReviewPassword());
        $session = $this->requireSession($accessToken->getSession());

        return new JsonResponse([
            'session' => $this->responseBuilder->session($session),
            'annotations' => array_map(
                $this->responseBuilder->annotation(...),
                $this->entityManager->getRepository(ReplayAnnotation::class)->findBy(['session' => $session], ['startTimeMs' => 'ASC']),
            ),
            'access' => $this->accessTokenService->response($accessToken),
        ]);
    }

    #[Route('/api/shared-review/{token}/playback', name: 'api_shared_replay_review_playback', methods: ['GET'])]
    public function playback(string $token): Response
    {
        $accessToken = $this->accessTokenService->validatePlainToken($token, false, $this->sharedReviewPassword());
        $session = $this->requireSession($accessToken->getSession());
        $video = $session->getVideo();
        if (null === $video) {
            throw new BadRequestHttpException('Shared review session has no replay video.');
        }

        return $this->mediaResponseFactory->createPlaybackResponse(
            $video->getStorageKey(),
            $video->getMimeType(),
            $video->getOriginalFilename(),
        );
    }

    #[Route('/api/shared-review/{token}/annotations', name: 'api_shared_replay_review_annotations_create', methods: ['POST'])]
    public function createAnnotation(string $token, Request $request): JsonResponse
    {
        $accessToken = $this->accessTokenService->validatePlainToken($token, true, $this->sharedReviewPassword());
        $session = $this->requireSession($accessToken->getSession());
        $payload = $this->decodeJsonPayload($request);
        $eventKind = $this->requireString($payload, 'eventKind');
        $category = $this->requireString($payload, 'category');
        $startTimeMs = $this->requireInt($payload, 'startTimeMs');
        $endTimeMs = $this->requireInt($payload, 'endTimeMs');
        $this->validateAnnotation($session, $eventKind, $category, $startTimeMs, $endTimeMs);

        $createdBy = $this->security->getUser() instanceof User
            ? $this->security->getUser()
            : $accessToken->getCreatedByUser();
        if (!$createdBy instanceof User) {
            throw new BadRequestHttpException('Shared review link has no creator context.');
        }

        $annotation = (new ReplayAnnotation())
            ->setSession($session)
            ->setCreatedByUser($createdBy)
            ->setEventKind($eventKind)
            ->setCategory($category)
            ->setStartTimeMs($startTimeMs)
            ->setEndTimeMs($endTimeMs)
            ->setStartFrame($this->optionalInt($payload['startFrame'] ?? null))
            ->setEndFrame($this->optionalInt($payload['endFrame'] ?? null))
            ->setTitle($this->optionalString($payload['title'] ?? null))
            ->setNotes($this->optionalString($payload['notes'] ?? null))
            ->setAnswer($this->optionalString($payload['answer'] ?? null));

        $this->entityManager->persist($annotation);
        $this->entityManager->flush();

        return new JsonResponse($this->responseBuilder->annotation($annotation), JsonResponse::HTTP_CREATED);
    }

    private function requireSession(?ReplayReviewSession $session): ReplayReviewSession
    {
        if (!$session instanceof ReplayReviewSession) {
            throw new BadRequestHttpException('Shared review link is not attached to a session.');
        }

        return $session;
    }

    private function sharedReviewPassword(): ?string
    {
        $password = $this->requestStack->getCurrentRequest()?->headers->get('X-Shared-Review-Password');

        return is_string($password) && '' !== trim($password) ? $password : null;
    }

    private function validateAnnotation(ReplayReviewSession $session, string $eventKind, string $category, int $startTimeMs, int $endTimeMs): void
    {
        if (!$this->categoryCatalog->isValidEventKind($eventKind)) {
            throw new BadRequestHttpException('eventKind is invalid.');
        }
        if (!$this->categoryCatalog->isValidCategory($eventKind, $category)) {
            throw new BadRequestHttpException('category is invalid for eventKind.');
        }
        if ($startTimeMs < 0 || $endTimeMs <= $startTimeMs) {
            throw new BadRequestHttpException('Annotation range is invalid.');
        }
        if (($endTimeMs - $startTimeMs) > 10000) {
            throw new BadRequestHttpException('Annotation clips cannot exceed 10 seconds.');
        }

        $durationMs = $session->getVideo()?->getDurationMs() ?? 0;
        if ($durationMs > 0 && $endTimeMs > $durationMs) {
            throw new BadRequestHttpException('Annotation range exceeds replay duration.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJsonPayload(Request $request): array
    {
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        return $payload;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function requireString(array $payload, string $field): string
    {
        $value = $payload[$field] ?? null;
        if (!is_string($value) || '' === trim($value)) {
            throw new BadRequestHttpException(sprintf('%s is required.', $field));
        }

        return trim($value);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function requireInt(array $payload, string $field): int
    {
        $value = $payload[$field] ?? null;
        if (!is_int($value) && !(is_string($value) && preg_match('/^-?\d+$/', $value))) {
            throw new BadRequestHttpException(sprintf('%s must be an integer.', $field));
        }

        return (int) $value;
    }

    private function optionalInt(mixed $value): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (!is_int($value) && !(is_string($value) && preg_match('/^-?\d+$/', $value))) {
            throw new BadRequestHttpException('Optional frame values must be integers.');
        }

        return (int) $value;
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
}
