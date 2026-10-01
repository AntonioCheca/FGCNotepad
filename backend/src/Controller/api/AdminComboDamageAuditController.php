<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Service\ComboDamageAuditService;
use App\Service\EndpointAuthorizationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/combo-damage-audits', name: 'api_admin_combo_damage_audits_')]
class AdminComboDamageAuditController extends AbstractController
{
    private const MAX_COMBO_IDS = 1000;

    public function __construct(
        private readonly EndpointAuthorizationService $endpointAuthorizationService,
        private readonly ComboDamageAuditService $comboDamageAuditService,
        private readonly Security $security,
    ) {
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
            $this->endpointAuthorizationService->assertCanManageUsers($actor);
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        $payload = json_decode((string) $request->getContent(), true);
        $comboIds = is_array($payload) ? ($payload['comboIds'] ?? null) : null;
        if (!is_array($comboIds) || [] === $comboIds || !array_is_list($comboIds) || count($comboIds) > self::MAX_COMBO_IDS) {
            return new JsonResponse(['error' => sprintf('comboIds must be a list of 1 to %d combo ids.', self::MAX_COMBO_IDS)], Response::HTTP_BAD_REQUEST);
        }
        foreach ($comboIds as $comboId) {
            if (!is_int($comboId) || $comboId <= 0) {
                return new JsonResponse(['error' => 'comboIds must contain only positive integers.'], Response::HTTP_BAD_REQUEST);
            }
        }

        return new JsonResponse($this->comboDamageAuditService->audit($comboIds), Response::HTTP_OK);
    }
}
