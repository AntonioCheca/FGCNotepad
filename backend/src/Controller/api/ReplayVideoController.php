<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ReplayVideo;
use App\Entity\User;
use App\Repository\ReplayVideoRepository;
use App\Service\EndpointAuthorizationService;
use App\Service\ReplayMediaResponseFactory;
use App\Service\ReplayLabResponseBuilder;
use App\Service\ReplayVideoSourceService;
use App\Service\ReplayStorage\VideoStorageInterface;
use App\Service\ReplayVideoUploadService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/replay-videos', name: 'api_replay_videos_')]
final class ReplayVideoController extends AbstractController
{
    public function __construct(
        private readonly ReplayVideoRepository $replayVideoRepository,
        private readonly ReplayVideoUploadService $uploadService,
        private readonly ReplayLabResponseBuilder $responseBuilder,
        private readonly EndpointAuthorizationService $authorizationService,
        private readonly EntityManagerInterface $entityManager,
        private readonly VideoStorageInterface $storage,
        private readonly ReplayMediaResponseFactory $mediaResponseFactory,
        private readonly ReplayVideoSourceService $sourceService,
        private readonly Security $security,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $actor = $this->requireUser();
        $videos = $this->replayVideoRepository->findBy(
            ['ownerUser' => $actor],
            ['createdAt' => 'DESC'],
            100,
        );

        return new JsonResponse(array_map($this->responseBuilder->video(...), $videos));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $actor = $this->requireUser();
        $file = $request->files->get('video');
        if (!$file instanceof UploadedFile) {
            throw new BadRequestHttpException('video file is required.');
        }

        $fps = $this->parseOptionalFloat($request->request->get('fps'));
        $video = $this->uploadService->upload($actor, $file, $fps);

        return new JsonResponse($this->responseBuilder->video($video), JsonResponse::HTTP_CREATED);
    }

    #[Route('/youtube', name: 'create_youtube', methods: ['POST'])]
    public function createYouTube(Request $request): JsonResponse
    {
        $actor = $this->requireUser();
        $payload = $this->decodeJsonPayload($request);
        $youtubeUrl = $payload['youtubeUrl'] ?? null;
        if (!is_string($youtubeUrl) || '' === trim($youtubeUrl)) {
            throw new BadRequestHttpException('youtubeUrl is required.');
        }

        $title = $payload['title'] ?? null;
        if (null !== $title && !is_string($title)) {
            throw new BadRequestHttpException('title must be a string.');
        }

        $video = $this->sourceService->createYouTubeVideo(
            $actor,
            $youtubeUrl,
            $title,
            $this->parseOptionalFloat($payload['fps'] ?? null),
        );

        return new JsonResponse($this->responseBuilder->video($video), JsonResponse::HTTP_CREATED);
    }

    #[Route('/local-file', name: 'create_local_file', methods: ['POST'])]
    public function createLocalFile(Request $request): JsonResponse
    {
        $actor = $this->requireUser();
        $payload = $this->decodeJsonPayload($request);
        $filename = $payload['filename'] ?? null;
        if (!is_string($filename) || '' === trim($filename)) {
            throw new BadRequestHttpException('filename is required.');
        }

        $sizeBytes = $payload['sizeBytes'] ?? null;
        if (!is_int($sizeBytes) && !(is_string($sizeBytes) && preg_match('/^\d+$/', $sizeBytes))) {
            throw new BadRequestHttpException('sizeBytes must be an integer.');
        }

        $video = $this->sourceService->createLocalFileVideo(
            $actor,
            $filename,
            (int) $sizeBytes,
            $this->parseOptionalFloat($payload['fps'] ?? null),
        );

        return new JsonResponse($this->responseBuilder->video($video), JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'read', methods: ['GET'])]
    public function read(ReplayVideo $video): JsonResponse
    {
        $this->assertOwnsVideo($this->requireUser(), $video);

        return new JsonResponse($this->responseBuilder->video($video));
    }

    #[Route('/{id}/playback', name: 'playback', methods: ['GET'])]
    public function playback(ReplayVideo $video): Response
    {
        $this->assertOwnsVideo($this->requireUser(), $video);
        if (in_array($video->getSourceType(), [ReplayVideo::SOURCE_TYPE_YOUTUBE, ReplayVideo::SOURCE_TYPE_LOCAL_FILE], true)) {
            throw new BadRequestHttpException('This replay source is played by the browser and has no backend original media stream.');
        }

        return $this->mediaResponseFactory->createPlaybackResponse(
            $video->getStorageKey(),
            $video->getMimeType(),
            $video->getOriginalFilename(),
        );
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(ReplayVideo $video): JsonResponse
    {
        $this->assertOwnsVideo($this->requireUser(), $video);

        if (ReplayVideo::SOURCE_TYPE_YOUTUBE !== $video->getSourceType() && '' !== $video->getStorageKey() && $this->storage->exists($video->getStorageKey())) {
            $this->storage->delete($video->getStorageKey());
        }

        $video
            ->setStatus(ReplayVideo::STATUS_DELETED)
            ->setDeletedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());

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

    private function parseOptionalFloat(mixed $value): ?float
    {
        if (null === $value || '' === $value) {
            return null;
        }

        if (!is_numeric($value)) {
            throw new BadRequestHttpException('fps must be numeric.');
        }

        return (float) $value;
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
