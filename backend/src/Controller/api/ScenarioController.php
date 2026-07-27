<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\Scenario;
use App\Entity\User;
use App\Repository\CharacterRepository;
use App\Repository\MoveRepository;
use App\Repository\ScenarioRepository;
use App\Service\AggregatedDefenseCatalogService;
use App\Service\EndpointAuthorizationService;
use App\Service\ModerationTransitionService;
use App\Service\ScenarioMatrixMapper;
use App\Service\ScenarioExecutionModeService;
use App\Service\ScenarioLinkedExpectedValueResolverService;
use App\Service\ScenarioResponseBuilder;
use App\Service\ScenarioLayerSolveService;
use App\Service\ScenarioResourceContextService;
use App\Service\ScenarioComboContextService;
use App\Service\ResolveScenarioDynamicComboCellsService;
use App\Service\ResolveDynamicComboCellService;
use App\Service\CharacterObjectCatalog;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Uid\Uuid;
use App\Util\Enum\ModerationState;

#[Route('/api/scenarios', name: 'api_scenarios_')]
class ScenarioController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
        private readonly ScenarioRepository $scenarioRepository,
        private readonly CharacterRepository $characterRepository,
        private readonly MoveRepository $moveRepository,
        private readonly AggregatedDefenseCatalogService $aggregatedDefenseCatalogService,
        private readonly ScenarioResponseBuilder $scenarioResponseBuilder,
        private readonly ScenarioLayerSolveService $scenarioLayerSolveService,
        private readonly ScenarioLinkedExpectedValueResolverService $scenarioLinkedExpectedValueResolverService,
        private readonly ScenarioMatrixMapper $scenarioMatrixMapper,
        private readonly ResolveScenarioDynamicComboCellsService $resolveScenarioDynamicComboCellsService,
        private readonly ResolveDynamicComboCellService $resolveDynamicComboCellService,
        private readonly ScenarioExecutionModeService $scenarioExecutionModeService,
        private readonly ScenarioResourceContextService $scenarioResourceContextService,
        private readonly ScenarioComboContextService $scenarioComboContextService,
        private readonly CharacterObjectCatalog $requirementSpecificCharacterCatalog,
        private readonly EndpointAuthorizationService $endpointAuthorizationService,
        private readonly ModerationTransitionService $moderationTransitionService,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[Route('/', name: 'list_trailing_slash', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $query = $request->query->get('q', '');
        $scenarioType = $request->query->get('scenarioType');
        $defenderCharacterId = $request->query->get('defenderCharacterId');
        $attackerCharacterId = $request->query->get('attackerCharacterId');
        $triggerMoveId = $request->query->get('triggerMoveId');
        $limit = $request->query->getInt('size', 50);

        if (!is_string($query)) {
            return new JsonResponse(['error' => 'Query parameter q must be a string.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $scenarios = $this->scenarioRepository->searchByFilters(
            $query,
            is_string($scenarioType) ? $scenarioType : null,
            is_string($defenderCharacterId) ? $defenderCharacterId : null,
            is_string($attackerCharacterId) ? $attackerCharacterId : null,
            is_string($triggerMoveId) ? $triggerMoveId : null,
            $limit
        );

        return new JsonResponse($this->scenarioResponseBuilder->buildList($scenarios), JsonResponse::HTTP_OK);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        try {
            $data = $this->decodeRequestBody($request);
            $scenario = new Scenario();

            $this->entityManager->getConnection()->transactional(function () use ($scenario, $data, $actor): void {
                $this->hydrateScenario($scenario, $data, true, $actor);
                $this->resolveScenarioDynamicComboCellsService->resolveForScenario(
                    $scenario,
                    $actor,
                    null,
                    null,
                    null,
                    $this->scenarioComboContextService->buildEffectiveContext($scenario, $data)
                );
                $scenario->setAuthor($actor);
                $this->moderationTransitionService->submitScenarioForReview($scenario);

                $this->entityManager->persist($scenario);
                $this->entityManager->flush();
            });
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], JsonResponse::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->scenarioResponseBuilder->buildDetail($scenario), JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'read', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['GET'])]
    public function read(string $id): JsonResponse
    {
        $scenario = $this->findByPublicId($id);

        if ($scenario->getModerationState() !== ModerationState::APPROVED->value) {
            $actor = $this->extractCurrentUser();
            if (null === $actor) {
                throw new NotFoundHttpException(sprintf('Scenario with ID %s not found', $id));
            }

            try {
                $this->endpointAuthorizationService->assertCanMutateOwnedContent($actor, $scenario->getAuthor(), 'Scenario not found.');
            } catch (AccessDeniedHttpException) {
                throw new NotFoundHttpException(sprintf('Scenario with ID %s not found', $id));
            }
        }

        return new JsonResponse($this->scenarioResponseBuilder->buildDetail($scenario), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['PATCH'])]
    public function update(string $id, Request $request): JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $scenario = $this->findByPublicId($id);
        try {
            $this->endpointAuthorizationService->assertCanMutateOwnedContent($actor, $scenario->getAuthor());
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], JsonResponse::HTTP_FORBIDDEN);
        }

        $data = $this->decodeRequestBody($request);

        $this->entityManager->getConnection()->transactional(function () use ($scenario, $data, $actor): void {
            $this->hydrateScenario($scenario, $data, false, $actor);

            if (array_key_exists('matrix', $data) || array_key_exists('attackerCharacterId', $data) || array_key_exists('comboContext', $data)) {
                $this->resolveScenarioDynamicComboCellsService->resolveForScenario(
                    $scenario,
                    $actor,
                    null,
                    null,
                    null,
                    $this->scenarioComboContextService->buildEffectiveContext($scenario, $data)
                );
            }

            $this->moderationTransitionService->submitScenarioForReview($scenario);

            $this->entityManager->flush();
        });

        return new JsonResponse($this->scenarioResponseBuilder->buildDetail($scenario), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $scenario = $this->findByPublicId($id);
        try {
            $this->endpointAuthorizationService->assertCanMutateOwnedContent($actor, $scenario->getAuthor());
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], JsonResponse::HTTP_FORBIDDEN);
        }

        $this->entityManager->remove($scenario);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/moderation', name: 'moderate', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['PATCH'])]
    public function moderate(string $id, Request $request): JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
            $this->endpointAuthorizationService->assertCanModerateContent($actor);
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], JsonResponse::HTTP_FORBIDDEN);
        }

        $scenario = $this->findByPublicId($id);
        $payload = $this->decodeRequestBody($request);
        $targetState = $payload['state'] ?? null;
        if (!is_string($targetState) || '' === trim($targetState)) {
            return new JsonResponse(['error' => 'state is required'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $reason = isset($payload['reason']) && is_string($payload['reason']) ? $payload['reason'] : null;
        $this->moderationTransitionService->moderateScenario($scenario, $actor, $targetState, $reason);
        $this->entityManager->flush();

        return new JsonResponse([
            'message' => 'Scenario moderation updated',
            'moderationState' => $scenario->getModerationState(),
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/{id}/resolve-dynamic-cells', name: 'resolve_dynamic_cells', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['POST'])]
    public function resolveDynamicCells(string $id, Request $request): JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $scenario = $this->findByPublicId($id);
        try {
            $this->endpointAuthorizationService->assertCanMutateOwnedContent($actor, $scenario->getAuthor());
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], JsonResponse::HTTP_FORBIDDEN);
        }

        $execution = $this->parseExecutionModePayload($request);
        $requestPayload = $this->decodeOptionalRequestBody($request);
        $resourceContext = $this->scenarioResourceContextService->parseOptional($requestPayload);
        $comboContext = $this->scenarioComboContextService->buildEffectiveContext($scenario, $requestPayload);

        $summary = $this->resolveScenarioDynamicComboCellsService->resolveForScenario(
            $scenario,
            $actor,
            $execution['mode'],
            $execution['difficultyCap'],
            $resourceContext,
            $comboContext
        );
        $this->entityManager->flush();

        return new JsonResponse([
            'scenario' => $this->scenarioResponseBuilder->buildDetail($scenario),
            'resolution' => $summary,
            'executionMode' => [
                'mode' => $execution['mode'],
                'difficultyCap' => $execution['difficultyCap'],
            ],
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/{id}/solve-layers', name: 'solve_layers', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['POST'])]
    public function solveLayers(string $id, Request $request): JsonResponse
    {
        $scenario = $this->findByPublicId($id);
        $execution = $this->parseExecutionModePayload($request);

        if ('my_knowledge' === $execution['mode']) {
            return new JsonResponse([
                'error' => 'Execution mode my_knowledge is not supported for scenario layer cache.',
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        $solvedLayers = $this->scenarioLayerSolveService->solveByLayer(
            $scenario,
            $execution['mode'],
            $execution['difficultyCap']
        );

        return new JsonResponse([
            'scenarioId' => $scenario->getPublicId()->toRfc4122(),
            'executionMode' => [
                'mode' => $execution['mode'],
                'difficultyCap' => $execution['difficultyCap'],
            ],
            'maxLayer' => $solvedLayers['maxLayer'],
            'layers' => $solvedLayers['layers'],
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/{id}/solve-linked-ev', name: 'solve_linked_ev', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['POST'])]
    public function solveLinkedExpectedValue(string $id, Request $request): JsonResponse
    {
        $scenario = $this->findByPublicId($id);
        $execution = $this->parseExecutionModePayload($request);
        $requestPayload = $this->decodeOptionalRequestBody($request);
        $resourceContext = $this->scenarioResourceContextService->parseOptional($requestPayload);

        if ('my_knowledge' === $execution['mode']) {
            return new JsonResponse([
                'error' => 'Execution mode my_knowledge is not supported for linked scenario EV solving.',
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        $solution = $this->scenarioLinkedExpectedValueResolverService->resolve(
            $scenario,
            $this->extractCurrentUser(),
            $execution['mode'],
            $execution['difficultyCap'],
            $resourceContext,
            $requestPayload,
        );

        return new JsonResponse([
            'scenarioId' => $scenario->getPublicId()->toRfc4122(),
            'executionMode' => [
                'mode' => $execution['mode'],
                'difficultyCap' => $execution['difficultyCap'],
            ],
            'depth' => $solution['depth'],
            'expectedValue' => $solution['expectedValue'],
            'rowAxis' => $solution['rowAxis'],
            'columnAxis' => $solution['columnAxis'],
            'resolvedCells' => $solution['resolvedCells'],
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/resolve-dynamic-cell', name: 'resolve_dynamic_cell', methods: ['POST'])]
    public function resolveDynamicCell(Request $request): JsonResponse
    {
        $data = json_decode((string) $request->getContent(), true);
        if (!is_array($data)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        $attackerCharacterId = isset($data['attackerCharacterId']) && is_string($data['attackerCharacterId'])
            ? trim($data['attackerCharacterId'])
            : '';
        if ('' === $attackerCharacterId) {
            throw new BadRequestHttpException('attackerCharacterId is required.');
        }

        $starterMoveIds = isset($data['starterMoveIds']) && is_array($data['starterMoveIds']) ? $data['starterMoveIds'] : [];
        $normalizedStarterMoveIds = array_values(array_filter(
            $starterMoveIds,
            static fn (mixed $moveId): bool => is_string($moveId) && '' !== trim($moveId)
        ));
        if ([] === $normalizedStarterMoveIds) {
            throw new BadRequestHttpException('starterMoveIds is required and must contain at least one id.');
        }

        $starterContext = isset($data['starterContext']) && is_array($data['starterContext']) ? $data['starterContext'] : null;
        if (null === $starterContext) {
            throw new BadRequestHttpException('starterContext is required.');
        }

        $isPunishCounter = true === ($starterContext['isPunishCounter'] ?? false);
        $isCounterHit = true === ($starterContext['isCounterHit'] ?? false);
        if ($isPunishCounter && $isCounterHit) {
            throw new BadRequestHttpException('starterContext cannot set both isPunishCounter and isCounterHit to true.');
        }

        $hitType = $isPunishCounter
            ? 'punish_counter'
            : ($isCounterHit ? 'counter_hit' : 'normal');

        $executionPayload = is_array($data['executionMode'] ?? null) ? $data['executionMode'] : [];
        $requestedMode = isset($executionPayload['mode']) && is_string($executionPayload['mode'])
            ? $executionPayload['mode']
            : null;
        $requestedDifficultyCap = $this->scenarioExecutionModeService->normalizeDifficultyCap($executionPayload['difficultyCap'] ?? null);
        $normalizedMode = $this->scenarioExecutionModeService->normalizeMode($requestedMode, null !== $this->extractCurrentUser());
        $resourceContext = $this->scenarioResourceContextService->parseOptional($data);
        $comboContext = null;
        if (isset($data['scenarioId']) && is_string($data['scenarioId']) && '' !== trim($data['scenarioId'])) {
            $comboContext = $this->scenarioComboContextService->buildEffectiveContext($this->findByPublicId(trim($data['scenarioId'])), $data);
        }
        $resourceOwner = true === ($data['isComboInitiatorAttacker'] ?? true) ? 'attacker' : 'defender';

        $resolution = $this->resolveDynamicComboCellService->resolve(
            $attackerCharacterId,
            $normalizedStarterMoveIds,
            $hitType,
            $this->extractCurrentUser(),
            $normalizedMode,
            $requestedDifficultyCap,
            null !== $resourceContext ? $resourceContext[$resourceOwner] : null,
            $comboContext
        );

        return new JsonResponse([
            'resolvedDamage' => $resolution['resolvedDamage'],
            'resolvedComboId' => $resolution['resolvedComboId'],
            'resolvedStarterMoveId' => $resolution['resolvedStarterMoveId'],
            'executionMode' => [
                'mode' => $normalizedMode,
                'difficultyCap' => $requestedDifficultyCap,
            ],
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/aggregated-defense-capabilities', name: 'aggregated_defense_capabilities', methods: ['GET'])]
    public function aggregatedDefenseCapabilities(Request $request): JsonResponse
    {
        $characterId = $request->query->get('characterId');
        $character = null;

        if (is_string($characterId) && '' !== trim($characterId)) {
            $character = $this->resolveCharacter($characterId, 'characterId');
        }

        return new JsonResponse([
            'catalog' => $this->aggregatedDefenseCatalogService->catalog(),
            'capabilities' => $this->aggregatedDefenseCatalogService->capabilitiesForCharacter($character),
            'characterId' => $character?->getId()?->toRfc4122(),
            'characterName' => $character?->getName(),
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/combo-context/catalog', name: 'combo_context_catalog', methods: ['GET'])]
    public function comboContextCatalog(): JsonResponse
    {
        return new JsonResponse([
            'positionLocks' => [
                ['value' => 'viewer_default_midscreen', 'label' => 'Viewer decides, default midscreen'],
                ['value' => 'corner', 'label' => 'Always corner'],
                ['value' => 'midscreen', 'label' => 'Always midscreen'],
            ],
            'characterStatuses' => $this->requirementSpecificCharacterCatalog->listForApi(),
        ], JsonResponse::HTTP_OK);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function hydrateScenario(Scenario $scenario, array $data, bool $isCreate, User $actor): void
    {
        if ($isCreate || array_key_exists('name', $data)) {
            $name = isset($data['name']) && is_string($data['name']) ? trim($data['name']) : '';
            if ('' === $name) {
                throw new BadRequestHttpException('Field name is required.');
            }

            $scenario->setName($name);
        }

        if ($isCreate || array_key_exists('scenarioType', $data)) {
            $scenarioType = isset($data['scenarioType']) && is_string($data['scenarioType']) ? trim($data['scenarioType']) : '';
            if ('' === $scenarioType) {
                throw new BadRequestHttpException('Field scenarioType is required.');
            }

            $normalizedScenarioType = mb_strtolower($scenarioType);
            if (!in_array($normalizedScenarioType, ['oki', 'blockstring', 'aggregated_oki'], true)) {
                throw new BadRequestHttpException('scenarioType must be either oki, blockstring, or aggregated_oki.');
            }

            $scenario->setScenarioType($normalizedScenarioType);
        }

        if ($isCreate || array_key_exists('defenderCharacterId', $data)) {
            $scenario->setDefenderCharacter($this->resolveCharacter($data['defenderCharacterId'] ?? null, 'defenderCharacterId'));
        }

        if ($isCreate || array_key_exists('attackerCharacterId', $data)) {
            $scenario->setAttackerCharacter($this->resolveCharacter($data['attackerCharacterId'] ?? null, 'attackerCharacterId'));
        }

        if ($isCreate || array_key_exists('triggerMoveId', $data)) {
            $scenario->setTriggerMove($this->resolveMove($data['triggerMoveId'] ?? null));
        }

        if ($isCreate || array_key_exists('matrix', $data)) {
            $matrix = $data['matrix'] ?? null;
            if (!is_array($matrix)) {
                throw new BadRequestHttpException('Field matrix is required and must be an object.');
            }

            if ($this->aggregatedDefenseCatalogService->isAggregatedScenarioType($scenario->getScenarioType())) {
                $matrix = $this->aggregatedDefenseCatalogService->normalizeAggregatedMatrix($matrix);
            }

            $this->scenarioMatrixMapper->replaceScenarioMatrixFromPayload($scenario, $matrix);
        }

        $this->scenarioComboContextService->hydrateScenarioContext($scenario, $data);

        if (array_key_exists('isEssential', $data)) {
            try {
                $this->endpointAuthorizationService->assertCanManageEssentialFlag($actor);
            } catch (AccessDeniedHttpException $exception) {
                throw new AccessDeniedHttpException('Forbidden', $exception);
            }

            if (!is_bool($data['isEssential'])) {
                throw new BadRequestHttpException('isEssential must be a boolean value.');
            }

            $scenario->setIsEssential($data['isEssential']);
        }

        if (null === $scenario->getDefenderCharacter() || null === $scenario->getAttackerCharacter() || null === $scenario->getTriggerMove()) {
            throw new BadRequestHttpException('Scenario definition requires defenderCharacterId, attackerCharacterId and triggerMoveId.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeRequestBody(Request $request): array
    {
        $decoded = json_decode($request->getContent(), true);
        if (!is_array($decoded)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        return $decoded;
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeOptionalRequestBody(Request $request): array
    {
        $content = trim($request->getContent());
        if ('' === $content) {
            return [];
        }

        $decoded = json_decode($content, true);
        if (!is_array($decoded)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        return $decoded;
    }

    private function findByPublicId(string $id): Scenario
    {
        if (!Uuid::isValid($id)) {
            throw new NotFoundHttpException(sprintf('Scenario with ID %s not found', $id));
        }

        $scenario = $this->scenarioRepository->findOneByPublicId($id);
        if (null === $scenario) {
            throw new NotFoundHttpException(sprintf('Scenario with ID %s not found', $id));
        }

        return $scenario;
    }

    private function resolveCharacter(mixed $value, string $fieldName): \App\Entity\Character
    {
        if (!is_string($value) || '' === trim($value)) {
            throw new BadRequestHttpException(sprintf('Field %s must be a non-empty string.', $fieldName));
        }

        $character = $this->characterRepository->find(trim($value));
        if (null === $character) {
            throw new BadRequestHttpException(sprintf('Character %s was not found.', trim($value)));
        }

        return $character;
    }

    private function resolveMove(mixed $value): \App\Entity\Move
    {
        if (!is_string($value) || '' === trim($value)) {
            throw new BadRequestHttpException('Field triggerMoveId must be a non-empty string.');
        }

        $move = $this->moveRepository->find(trim($value));
        if (null === $move) {
            throw new BadRequestHttpException(sprintf('Move %s was not found.', trim($value)));
        }

        return $move;
    }

    /**
     * @return array{mode:string,difficultyCap:int|null}
     */
    private function parseExecutionModePayload(Request $request): array
    {
        $content = trim((string) $request->getContent());
        $decoded = [];

        if ('' !== $content) {
            $decodedBody = json_decode($content, true);
            if (!is_array($decodedBody)) {
                throw new BadRequestHttpException('Invalid JSON payload.');
            }
            $decoded = $decodedBody;
        }

        $executionPayload = is_array($decoded['executionMode'] ?? null) ? $decoded['executionMode'] : [];
        $requestedMode = isset($executionPayload['mode']) && is_string($executionPayload['mode'])
            ? $executionPayload['mode']
            : null;

        return [
            'mode' => $this->scenarioExecutionModeService->normalizeMode($requestedMode, null !== $this->extractCurrentUser()),
            'difficultyCap' => $this->scenarioExecutionModeService->normalizeDifficultyCap($executionPayload['difficultyCap'] ?? null),
        ];
    }

    private function extractCurrentUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
    }
}
