<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ReplayReviewSession;
use App\Entity\ReplayVideo;
use App\Entity\User;
use App\Repository\ReplayReviewSessionRepository;
use App\Repository\ReplayVideoRepository;
use App\Service\EndpointAuthorizationService;
use App\Service\ReplayAnnotationExportService;
use App\Service\ReplayLabResponseBuilder;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/replay-review-sessions', name: 'api_replay_review_sessions_')]
final class ReplayReviewSessionController extends AbstractController
{
    public function __construct(
        private readonly ReplayReviewSessionRepository $sessionRepository,
        private readonly ReplayVideoRepository $videoRepository,
        private readonly ReplayLabResponseBuilder $responseBuilder,
        private readonly ReplayAnnotationExportService $exportService,
        private readonly EndpointAuthorizationService $authorizationService,
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $actor = $this->requireUser();
        $sessions = $this->sessionRepository->findBy(
            ['ownerUser' => $actor],
            ['updatedAt' => 'DESC'],
            100,
        );

        return new JsonResponse(array_map($this->responseBuilder->session(...), $sessions));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $actor = $this->requireUser();
        $payload = $this->decodeJsonPayload($request);
        $videoId = $payload['videoId'] ?? null;
        if (!is_string($videoId) || '' === trim($videoId)) {
            throw new BadRequestHttpException('videoId is required.');
        }

        $video = $this->videoRepository->find($videoId);
        if (!$video instanceof ReplayVideo) {
            throw new NotFoundHttpException('Replay video not found.');
        }
        $this->assertOwnsVideo($actor, $video);

        $title = $payload['title'] ?? null;
        if (!is_string($title) || '' === trim($title)) {
            $title = sprintf('Replay review %s', (new \DateTimeImmutable())->format('Y-m-d'));
        }

        $session = (new ReplayReviewSession())
            ->setVideo($video)
            ->setOwnerUser($actor)
            ->setCreatedByUser($actor)
            ->setTitle(trim($title));

        $this->entityManager->persist($session);
        $this->entityManager->flush();

        return new JsonResponse($this->responseBuilder->session($session), JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'read', methods: ['GET'])]
    public function read(ReplayReviewSession $session): JsonResponse
    {
        $this->assertOwnsSession($this->requireUser(), $session);

        return new JsonResponse($this->responseBuilder->session($session));
    }

    #[Route('/{id}', name: 'update', methods: ['PATCH'])]
    public function update(ReplayReviewSession $session, Request $request): JsonResponse
    {
        $this->assertOwnsSession($this->requireUser(), $session);
        $payload = $this->decodeJsonPayload($request);

        if (array_key_exists('title', $payload)) {
            if (!is_string($payload['title']) || '' === trim($payload['title'])) {
                throw new BadRequestHttpException('title must be a non-empty string.');
            }
            $session->setTitle(trim($payload['title']));
        }

        if (array_key_exists('status', $payload)) {
            if (!is_string($payload['status']) || !in_array($payload['status'], [ReplayReviewSession::STATUS_DRAFT, ReplayReviewSession::STATUS_SAVED, ReplayReviewSession::STATUS_ARCHIVED], true)) {
                throw new BadRequestHttpException('status is invalid.');
            }
            $session->setStatus($payload['status']);
        }

        $session->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return new JsonResponse($this->responseBuilder->session($session));
    }

    #[Route('/{id}/save', name: 'save', methods: ['POST'])]
    public function save(ReplayReviewSession $session): JsonResponse
    {
        $this->assertOwnsSession($this->requireUser(), $session);
        $session
            ->setStatus(ReplayReviewSession::STATUS_SAVED)
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return new JsonResponse($this->responseBuilder->session($session));
    }

    #[Route('/{id}/export', name: 'export', methods: ['POST'])]
    public function export(ReplayReviewSession $session): JsonResponse
    {
        $this->assertOwnsSession($this->requireUser(), $session);
        $session
            ->setStatus(ReplayReviewSession::STATUS_SAVED)
            ->setUpdatedAt(new \DateTimeImmutable());

        $result = $this->exportService->exportSession($session);

        return new JsonResponse($result->toArray());
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(ReplayReviewSession $session): JsonResponse
    {
        $this->assertOwnsSession($this->requireUser(), $session);
        $this->entityManager->remove($session);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }

    private function requireUser(): User
    {
        try {
            return $this->authorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            throw new UnauthorizedHttpException('', 'Authentication required.');
        }
    }

    private function assertOwnsVideo(User $actor, ReplayVideo $video): void
    {
        if ($video->getOwnerUser() !== $actor) {
            throw new AccessDeniedHttpException('Replay video not accessible.');
        }
    }

    private function assertOwnsSession(User $actor, ReplayReviewSession $session): void
    {
        if ($session->getOwnerUser() !== $actor) {
            throw new AccessDeniedHttpException('Replay review session not accessible.');
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
}
