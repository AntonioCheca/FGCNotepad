<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Service\EndpointAuthorizationService;
use App\Service\ModerationQueueService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/moderation', name: 'api_moderation_')]
class ModerationController extends AbstractController
{
    public function __construct(
        private readonly EndpointAuthorizationService $endpointAuthorizationService,
        private readonly ModerationQueueService $moderationQueueService,
        private readonly Security $security,
    ) {
    }

    #[Route('/queue', name: 'queue', methods: ['GET'])]
    public function queue(Request $request): JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
            $this->endpointAuthorizationService->assertCanModerateContent($actor);
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        try {
            $payload = $this->moderationQueueService->getQueue(
                $this->parseListFilter($request->query->all()['contentType'] ?? null),
                $this->parseListFilter($request->query->all()['state'] ?? null),
                (string) $request->query->get('sort', 'oldest')
            );
        } catch (\InvalidArgumentException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($payload, Response::HTTP_OK);
    }

    /**
     * @return list<string>
     */
    private function parseListFilter(mixed $rawFilter): array
    {
        if (null === $rawFilter) {
            return [];
        }

        if (is_string($rawFilter)) {
            $parts = explode(',', $rawFilter);

            return array_values(array_filter(array_map(
                static fn (string $part): string => trim($part),
                $parts
            ), static fn (string $part): bool => '' !== $part));
        }

        if (is_array($rawFilter)) {
            $normalized = [];
            foreach ($rawFilter as $value) {
                if (!is_string($value)) {
                    continue;
                }
                $parts = explode(',', $value);
                foreach ($parts as $part) {
                    $trimmed = trim($part);
                    if ('' !== $trimmed) {
                        $normalized[] = $trimmed;
                    }
                }
            }

            return array_values($normalized);
        }

        return [];
    }
}
