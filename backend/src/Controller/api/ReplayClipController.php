<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ReplayClip;
use App\Entity\User;
use App\Service\EndpointAuthorizationService;
use App\Service\ReplayMediaResponseFactory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/replay-clips', name: 'api_replay_clips_')]
final class ReplayClipController extends AbstractController
{
    public function __construct(
        private readonly ReplayMediaResponseFactory $mediaResponseFactory,
        private readonly EndpointAuthorizationService $authorizationService,
        private readonly Security $security,
    ) {
    }

    #[Route('/{id}/playback', name: 'playback', methods: ['GET'])]
    public function playback(ReplayClip $clip): Response
    {
        $this->assertOwnsClip($this->requireUser(), $clip);

        return $this->mediaResponseFactory->createPlaybackResponse(
            $clip->getStorageKey(),
            $clip->getMimeType(),
            sprintf('replay-clip-%s.mp4', (string) $clip->getId()),
        );
    }

    private function requireUser(): User
    {
        try {
            return $this->authorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            throw new UnauthorizedHttpException('', 'Authentication required.');
        }
    }

    private function assertOwnsClip(User $actor, ReplayClip $clip): void
    {
        if ($clip->getOwnerUser() !== $actor) {
            throw new AccessDeniedHttpException('Replay clip not accessible.');
        }
    }
}
