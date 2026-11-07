<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Service\EndpointAuthorizationService;
use App\Service\ReportBundle\ReportBundleService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/moderation/report-bundles', name: 'api_moderation_report_bundles_')]
final class ModerationReportBundleController extends AbstractController
{
    // Solving a report's scenarios takes seconds locally; leave room for a smaller production machine.
    private const TIME_LIMIT_SECONDS = 300;

    private const FAILURE_STATUS = [
        ReportBundleService::STATUS_INVALID => Response::HTTP_BAD_REQUEST,
        ReportBundleService::STATUS_CONFLICT => Response::HTTP_CONFLICT,
    ];

    public function __construct(
        private readonly EndpointAuthorizationService $endpointAuthorizationService,
        private readonly ReportBundleService $reportBundleService,
        private readonly Security $security,
    ) {
    }

    #[Route('/dry-run', name: 'dry_run', methods: ['POST'])]
    public function dryRun(Request $request): JsonResponse
    {
        return $this->run($request, true);
    }

    #[Route('', name: 'import', methods: ['POST'])]
    public function import(Request $request): JsonResponse
    {
        return $this->run($request, false);
    }

    private function run(Request $request, bool $dryRun): JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
            $this->endpointAuthorizationService->assertCanModerateContent($actor);
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        $document = json_decode((string) $request->getContent(), true);
        if (!is_array($document)) {
            return new JsonResponse(['error' => 'The file is not JSON.'], Response::HTTP_BAD_REQUEST);
        }

        set_time_limit(self::TIME_LIMIT_SECONDS);
        $result = $this->reportBundleService->import($document, $actor, $dryRun, $request->query->getBoolean('overwriteSiteEdits'));
        $status = $dryRun ? Response::HTTP_OK : (self::FAILURE_STATUS[$result['status']] ?? Response::HTTP_OK);

        return new JsonResponse($result, $status);
    }
}
