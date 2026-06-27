<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ReplayReviewAccessToken;
use App\Entity\ReplayReviewSession;
use App\Entity\User;
use App\Repository\ReplayReviewAccessTokenRepository;
use App\Service\EndpointAuthorizationService;
use App\Service\ReplayReviewAccessTokenService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

final class ReplayReviewShareLinkController extends AbstractController
{
    public function __construct(
        private readonly ReplayReviewAccessTokenService $accessTokenService,
        private readonly ReplayReviewAccessTokenRepository $accessTokenRepository,
        private readonly EndpointAuthorizationService $authorizationService,
        private readonly Security $security,
    ) {
    }

    #[Route('/api/replay-review-sessions/{id}/share-links', name: 'api_replay_review_session_share_links_list', methods: ['GET'])]
    public function list(ReplayReviewSession $session): JsonResponse
    {
        $actor = $this->requireUser();
        if ($session->getOwnerUser() !== $actor) {
            throw new AccessDeniedHttpException('Replay review session not accessible.');
        }

        return new JsonResponse(array_map(
            $this->accessTokenService->response(...),
            $this->accessTokenRepository->findForSession($session),
        ));
    }

    #[Route('/api/replay-review-sessions/{id}/share-links', name: 'api_replay_review_session_share_links_create', methods: ['POST'])]
    public function create(ReplayReviewSession $session, Request $request): JsonResponse
    {
        $actor = $this->requireUser();
        if ($session->getOwnerUser() !== $actor) {
            throw new AccessDeniedHttpException('Replay review session not accessible.');
        }

        $created = $this->accessTokenService->create($session, $actor, $this->decodeJsonPayload($request));

        return new JsonResponse(
            $this->accessTokenService->response($created['accessToken'], $created['plainToken']),
            JsonResponse::HTTP_CREATED,
        );
    }

    #[Route('/api/share-links/{id}/revoke', name: 'api_replay_review_share_links_revoke', methods: ['POST'])]
    public function revoke(ReplayReviewAccessToken $accessToken): JsonResponse
    {
        return new JsonResponse($this->accessTokenService->response($this->accessTokenService->revoke($accessToken, $this->requireUser())));
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
}
