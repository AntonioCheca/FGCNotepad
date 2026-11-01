<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\User;
use App\Repository\ScenarioRepository;
use App\Service\EndpointAuthorizationService;
use App\Service\ScenarioTransfer\ScenarioExportService;
use App\Service\ScenarioTransfer\ScenarioImportService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/api/admin', name: 'api_admin_scenario_transfer_')]
class AdminScenarioTransferController extends AbstractController
{
    private const IMPORT_FAILURES = [
        ScenarioImportService::STATUS_INVALID => [Response::HTTP_BAD_REQUEST, 'The document is not a valid scenario_export_v1 file for this database.'],
        ScenarioImportService::STATUS_UNRESOLVED_STARTERS => [Response::HTTP_UNPROCESSABLE_ENTITY, 'Some dynamic combo starters resolve to no stored combo. Import their combos first.'],
        ScenarioImportService::STATUS_CONFLICT => [Response::HTTP_CONFLICT, 'Some scenarios were edited on the site since their last import. Re-run with overwriteSiteEdits to replace those edits.'],
    ];

    public function __construct(
        private readonly EndpointAuthorizationService $endpointAuthorizationService,
        private readonly ScenarioImportService $scenarioImportService,
        private readonly ScenarioExportService $scenarioExportService,
        private readonly ScenarioRepository $scenarioRepository,
        private readonly Security $security,
    ) {
    }

    #[Route('/scenario-imports/dry-run', name: 'dry_run', methods: ['POST'])]
    public function dryRun(Request $request): JsonResponse
    {
        $denied = $this->denyUnlessAdmin();
        if (null !== $denied) {
            return $denied;
        }

        $document = json_decode((string) $request->getContent(), true);
        if (!is_array($document)) {
            return new JsonResponse(['error' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->scenarioImportService->dryRun($document, $this->overwriteSiteEdits($request)), Response::HTTP_OK);
    }

    #[Route('/scenario-imports', name: 'import', methods: ['POST'])]
    public function import(Request $request): JsonResponse
    {
        $denied = $this->denyUnlessAdmin();
        if (null !== $denied) {
            return $denied;
        }

        $document = json_decode((string) $request->getContent(), true);
        if (!is_array($document)) {
            return new JsonResponse(['error' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        $actor = $this->security->getUser();
        $result = $this->scenarioImportService->import(
            $document,
            $actor instanceof User ? $actor : null,
            $this->overwriteSiteEdits($request),
            $request->query->has('linkPasses') ? $request->query->getInt('linkPasses') : null
        );
        $failure = self::IMPORT_FAILURES[$result['status']] ?? null;
        if (null !== $failure) {
            return new JsonResponse(['error' => $failure[1]] + $result, $failure[0]);
        }

        return new JsonResponse($result, Response::HTTP_OK);
    }

    #[Route('/scenario-exports/{id}', name: 'export_one', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['GET'])]
    public function exportOne(string $id): JsonResponse
    {
        $denied = $this->denyUnlessAdmin();
        if (null !== $denied) {
            return $denied;
        }

        $scenario = Uuid::isValid($id) ? $this->scenarioRepository->findOneByPublicId($id) : null;
        if (null === $scenario) {
            return new JsonResponse(['error' => 'Scenario not found.'], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse($this->scenarioExportService->exportDocument([$scenario]), Response::HTTP_OK);
    }

    #[Route('/scenario-exports', name: 'export_source', methods: ['GET'])]
    public function exportBySource(Request $request): JsonResponse
    {
        $denied = $this->denyUnlessAdmin();
        if (null !== $denied) {
            return $denied;
        }

        $source = trim((string) $request->query->get('source', ''));
        if ('' === $source) {
            return new JsonResponse(['error' => 'Query parameter source is required.'], Response::HTTP_BAD_REQUEST);
        }

        $scenarios = $this->scenarioRepository->findByImportSource($source);
        if ([] === $scenarios) {
            return new JsonResponse(['error' => sprintf('No scenarios were imported from source "%s".', $source)], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse($this->scenarioExportService->exportDocument($scenarios), Response::HTTP_OK);
    }

    private function overwriteSiteEdits(Request $request): bool
    {
        return $request->query->getBoolean('overwriteSiteEdits');
    }

    private function denyUnlessAdmin(): ?JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
            $this->endpointAuthorizationService->assertCanManageUsers($actor);
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        return null;
    }
}
