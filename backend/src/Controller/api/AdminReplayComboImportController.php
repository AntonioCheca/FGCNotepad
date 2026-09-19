<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\User;
use App\Service\EndpointAuthorizationService;
use App\Service\ReplayComboImportService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/replay-combo-imports', name: 'api_admin_replay_combo_imports_')]
class AdminReplayComboImportController extends AbstractController
{
    public function __construct(
        private readonly EndpointAuthorizationService $endpointAuthorizationService,
        private readonly ReplayComboImportService $replayComboImportService,
        private readonly Security $security,
    ) {
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $actor = $this->requireAdminActor();
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        $document = json_decode((string) $request->getContent(), true);
        if (!is_array($document)) {
            return new JsonResponse(['error' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            return new JsonResponse($this->replayComboImportService->import($document, $actor), Response::HTTP_OK);
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    private function requireAdminActor(): User
    {
        $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        $this->endpointAuthorizationService->assertCanManageUsers($actor);

        return $actor;
    }
}
