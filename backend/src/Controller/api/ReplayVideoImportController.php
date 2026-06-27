<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\User;
use App\Service\EndpointAuthorizationService;
use App\Service\LocalReplayImportService;
use App\Service\ReplayLabResponseBuilder;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/replay-video-imports', name: 'api_replay_video_imports_')]
final class ReplayVideoImportController extends AbstractController
{
    public function __construct(
        private readonly LocalReplayImportService $importService,
        private readonly ReplayLabResponseBuilder $responseBuilder,
        private readonly EndpointAuthorizationService $authorizationService,
        private readonly Security $security,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $this->requireUser();

        return new JsonResponse($this->importService->listImportableFiles());
    }

    #[Route('/{fileId}', name: 'create', methods: ['POST'])]
    public function import(string $fileId, Request $request): JsonResponse
    {
        $payload = $this->decodeJsonPayload($request);
        $fps = $this->optionalFloat($payload['fps'] ?? null);
        $deleteSource = $payload['deleteSource'] ?? false;
        if (!is_bool($deleteSource)) {
            throw new BadRequestHttpException('deleteSource must be boolean.');
        }

        $video = $this->importService->import($this->requireUser(), $fileId, $fps, $deleteSource);

        return new JsonResponse($this->responseBuilder->video($video), JsonResponse::HTTP_CREATED);
    }

    private function requireUser(): User
    {
        try {
            return $this->authorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            throw new UnauthorizedHttpException('', 'Authentication required.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJsonPayload(Request $request): array
    {
        if ('' === trim($request->getContent())) {
            return [];
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        return $payload;
    }

    private function optionalFloat(mixed $value): ?float
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (!is_numeric($value)) {
            throw new BadRequestHttpException('fps must be numeric.');
        }

        return (float) $value;
    }
}
