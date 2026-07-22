<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ReplayAnnotation;
use App\Entity\ReplayReviewSession;
use App\Entity\User;
use App\Repository\ReplayAnnotationRepository;
use App\Service\EndpointAuthorizationService;
use App\Service\BrowserReplayClipIngestService;
use App\Service\ReplayLabCategoryCatalog;
use App\Service\ReplayLabResponseBuilder;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

final class ReplayAnnotationController extends AbstractController
{
    public function __construct(
        private readonly ReplayAnnotationRepository $annotationRepository,
        private readonly ReplayLabCategoryCatalog $categoryCatalog,
        private readonly ReplayLabResponseBuilder $responseBuilder,
        private readonly BrowserReplayClipIngestService $clipIngestService,
        private readonly EndpointAuthorizationService $authorizationService,
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {
    }

    #[Route('/api/replay-review-sessions/{id}/annotations', name: 'api_replay_review_session_annotations_list', methods: ['GET'])]
    public function list(ReplayReviewSession $session): JsonResponse
    {
        $this->assertOwnsSession($this->requireUser(), $session);
        $annotations = $this->annotationRepository->findBy(
            ['session' => $session],
            ['startTimeMs' => 'ASC'],
        );

        return new JsonResponse(array_map($this->responseBuilder->annotation(...), $annotations));
    }

    #[Route('/api/replay-review-sessions/{id}/annotations', name: 'api_replay_review_session_annotations_create', methods: ['POST'])]
    public function create(ReplayReviewSession $session, Request $request): JsonResponse
    {
        $actor = $this->requireUser();
        $this->assertOwnsSession($actor, $session);
        $payload = $this->decodeJsonPayload($request);
        $eventKind = $this->requireString($payload, 'eventKind');
        $category = $this->requireString($payload, 'category');
        $startTimeMs = $this->requireInt($payload, 'startTimeMs');
        $endTimeMs = $this->requireInt($payload, 'endTimeMs');
        $this->validateAnnotation($session, $eventKind, $category, $startTimeMs, $endTimeMs);

        $annotation = (new ReplayAnnotation())
            ->setSession($session)
            ->setCreatedByUser($actor)
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

    #[Route('/api/replay-annotations/{id}', name: 'api_replay_annotations_update', methods: ['PATCH'])]
    public function update(ReplayAnnotation $annotation, Request $request): JsonResponse
    {
        $actor = $this->requireUser();
        $session = $annotation->getSession();
        if (null === $session) {
            throw new BadRequestHttpException('Annotation is not attached to a session.');
        }
        $this->assertOwnsSession($actor, $session);
        $payload = $this->decodeJsonPayload($request);

        $eventKind = array_key_exists('eventKind', $payload) ? $this->requireString($payload, 'eventKind') : $annotation->getEventKind();
        $category = array_key_exists('category', $payload) ? $this->requireString($payload, 'category') : $annotation->getCategory();
        $startTimeMs = array_key_exists('startTimeMs', $payload) ? $this->requireInt($payload, 'startTimeMs') : $annotation->getStartTimeMs();
        $endTimeMs = array_key_exists('endTimeMs', $payload) ? $this->requireInt($payload, 'endTimeMs') : $annotation->getEndTimeMs();
        $this->validateAnnotation($session, $eventKind, $category, $startTimeMs, $endTimeMs);

        $annotation
            ->setEventKind($eventKind)
            ->setCategory($category)
            ->setStartTimeMs($startTimeMs)
            ->setEndTimeMs($endTimeMs)
            ->setUpdatedAt(new \DateTimeImmutable());

        foreach (['startFrame', 'endFrame'] as $field) {
            if (array_key_exists($field, $payload)) {
                'startFrame' === $field
                    ? $annotation->setStartFrame($this->optionalInt($payload[$field]))
                    : $annotation->setEndFrame($this->optionalInt($payload[$field]));
            }
        }

        foreach (['title', 'notes', 'answer'] as $field) {
            if (array_key_exists($field, $payload)) {
                match ($field) {
                    'title' => $annotation->setTitle($this->optionalString($payload[$field])),
                    'notes' => $annotation->setNotes($this->optionalString($payload[$field])),
                    'answer' => $annotation->setAnswer($this->optionalString($payload[$field])),
                };
            }
        }

        $this->entityManager->flush();

        return new JsonResponse($this->responseBuilder->annotation($annotation));
    }

    #[Route('/api/replay-annotations/{id}', name: 'api_replay_annotations_delete', methods: ['DELETE'])]
    public function delete(ReplayAnnotation $annotation): JsonResponse
    {
        $session = $annotation->getSession();
        if (null === $session) {
            throw new BadRequestHttpException('Annotation is not attached to a session.');
        }
        $this->assertOwnsSession($this->requireUser(), $session);
        $this->entityManager->remove($annotation);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }

    #[Route('/api/replay-annotations/{id}/clip', name: 'api_replay_annotations_clip_upload', methods: ['POST'])]
    public function uploadClip(ReplayAnnotation $annotation, Request $request): JsonResponse
    {
        $actor = $this->requireUser();
        $session = $annotation->getSession();
        if (null === $session) {
            throw new BadRequestHttpException('Annotation is not attached to a session.');
        }
        $this->assertOwnsSession($actor, $session);

        $file = $request->files->get('clip');
        if (!$file instanceof UploadedFile) {
            throw new BadRequestHttpException('clip file is required.');
        }

        $durationMs = $this->requireFormInt($request, 'durationMs');
        try {
            $clip = $this->clipIngestService->ingest($actor, $annotation, $file, $durationMs);
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['message' => $exception->getMessage()], JsonResponse::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->responseBuilder->clip($clip), JsonResponse::HTTP_CREATED);
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

    private function requireUser(): User
    {
        try {
            return $this->authorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            throw new UnauthorizedHttpException('', 'Authentication required.');
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

    private function requireFormInt(Request $request, string $field): int
    {
        $value = $request->request->get($field);
        if (!is_string($value) || !preg_match('/^-?\d+$/', $value)) {
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
