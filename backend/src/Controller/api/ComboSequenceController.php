<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ComboSequences;
use App\Entity\User;
use App\Util\Enum\MoveType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Repository\CharacterRepository;
use App\Repository\ComboSequencesRepository;
use App\Repository\ConnectionTypeRepository;
use App\Service\ComboNotationTranslator;
use App\Service\ComboNotationDictionaryTranslator;
use App\Service\NotationCanonicalizer;
use App\Service\NotationDictionaryPreferenceService;
use App\Service\ComboSequenceCreationService;
use App\Service\ComboSequenceUpdateService;
use App\Service\ComboStarterModifierExtractor;
use App\Service\ComboCrouchRequirementInferenceService;
use App\Service\Sf6ComboDamageEstimatorService;
use App\Service\Sf6ComboResourceEstimatorService;
use App\Service\EndpointAuthorizationService;
use App\Service\ModerationTransitionService;
use App\Service\CharacterObjectCatalog;
use App\Util\Enum\ModerationState;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

#[Route('/api/combo-sequences', name: 'api_combo_sequences_')]
class ComboSequenceController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface      $entityManager,
        private SerializerInterface         $serializer,
        private ComboSequencesRepository    $comboSequencesRepository,
        private ConnectionTypeRepository    $connectionTypeRepository,
        private ComboSequenceCreationService $comboSequenceCreationService,
        private ComboSequenceUpdateService $comboSequenceUpdateService,
        private EndpointAuthorizationService $endpointAuthorizationService,
        private Security $security,
        private ModerationTransitionService $moderationTransitionService,
        private NotationDictionaryPreferenceService $notationDictionaryPreferenceService,
        private ComboNotationDictionaryTranslator $comboNotationDictionaryTranslator,
        private NotationCanonicalizer $notationCanonicalizer,
        private Sf6ComboDamageEstimatorService $sf6ComboDamageEstimatorService,
        private Sf6ComboResourceEstimatorService $sf6ComboResourceEstimatorService,
        private ComboCrouchRequirementInferenceService $comboCrouchRequirementInferenceService,
    )
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $rawMoveTypesValue = $request->query->all()['moveTypes'] ?? [];
        $rawMoveTypes = is_array($rawMoveTypesValue) ? $rawMoveTypesValue : [$rawMoveTypesValue];
        $normalizedMoveTypes = [];
        foreach ($rawMoveTypes as $moveType) {
            if (!is_string($moveType)) {
                continue;
            }

            $trimmed = trim(mb_strtolower($moveType));
            if ('' === $trimmed || !MoveType::isValid($trimmed)) {
                continue;
            }

            $normalizedMoveTypes[$trimmed] = $trimmed;
        }

        $filters = [
            'q' => $this->normalizeStringFilter($request->query->get('q')),
            'characterId' => $this->normalizeStringFilter($request->query->get('characterId')),
            'firstMoveId' => $this->normalizeStringFilter($request->query->get('firstMoveId')),
            'enderMoveId' => $this->normalizeStringFilter($request->query->get('enderMoveId')),
            'seasonId' => $this->normalizeIntegerFilter($request->query->get('seasonId')),
            'minDamage' => $this->normalizeIntegerFilter($request->query->get('minDamage')),
            'maxDamage' => $this->normalizeIntegerFilter($request->query->get('maxDamage')),
            'minDriveCost' => $this->normalizeFloatFilter($request->query->get('minDriveCost')),
            'maxDriveCost' => $this->normalizeFloatFilter($request->query->get('maxDriveCost')),
            'minMinimumDriveCost' => $this->normalizeFloatFilter($request->query->get('minMinimumDriveCost')),
            'maxMinimumDriveCost' => $this->normalizeFloatFilter($request->query->get('maxMinimumDriveCost')),
            'minMinimumDriveCostNoBurnout' => $this->normalizeFloatFilter($request->query->get('minMinimumDriveCostNoBurnout')),
            'maxMinimumDriveCostNoBurnout' => $this->normalizeFloatFilter($request->query->get('maxMinimumDriveCostNoBurnout')),
            'minDifficulty' => $this->normalizeIntegerFilter($request->query->get('minDifficulty')),
            'maxDifficulty' => $this->normalizeIntegerFilter($request->query->get('maxDifficulty')),
            'counterHitRequired' => $this->normalizeBooleanFilter($request->query->get('counterHitRequired')),
            'punishCounterRequired' => $this->normalizeBooleanFilter($request->query->get('punishCounterRequired')),
            'cornerRequired' => $this->normalizeBooleanFilter($request->query->get('cornerRequired')),
            'airborneRequired' => $this->normalizeBooleanFilter($request->query->get('airborneRequired')),
            'notCrouchingRequired' => $this->normalizeBooleanFilter($request->query->get('notCrouchingRequired')),
            'sideSwitchesRequired' => $this->normalizeBooleanFilter($request->query->get('sideSwitchesRequired')),
            'isEssential' => $this->normalizeBooleanFilter($request->query->get('isEssential')),
            'moveTypes' => array_values($normalizedMoveTypes),
            'requirementObjectName' => $this->normalizeStringFilter($request->query->get('requirementObjectName')),
            'requirementObjectStatus' => $this->normalizeStringFilter($request->query->get('requirementObjectStatus')),
            'addedObjectName' => $this->normalizeStringFilter($request->query->get('addedObjectName')),
            'addedObjectStatus' => $this->normalizeStringFilter($request->query->get('addedObjectStatus')),
            'consumedObjectName' => $this->normalizeStringFilter($request->query->get('consumedObjectName')),
            'sort' => $this->normalizeSortFilter($request->query->get('sort')),
            'sortDirection' => $this->normalizeSortDirectionFilter($request->query->get('sortDirection')),
        ];

        $limit = $request->query->getInt('size', 100);

        $actor = $this->security->getUser();
        $sequences = $this->comboSequencesRepository->searchNonLeafsByFilters(
            $filters,
            $limit,
            $actor instanceof User ? $actor : null,
        );
        $json = $this->serializer->serialize($sequences, 'json');

        return new JsonResponse($json, 200, [], true);
    }

    #[Route('/leafs/list', name: 'leafs', methods: ['GET'])]
    public function listLeafs(Request $request): JsonResponse
    {
        $characterId = trim((string) $request->query->get('character_id', ''));
        if ('' === $characterId) {
            return new JsonResponse([], JsonResponse::HTTP_OK);
        }

        $leafRows = $this->comboSequencesRepository->findLeafSummariesByCharacterId($characterId);
        $payload = array_map(
            static fn (array $leaf): array => [
                'id' => (int) $leaf['id'],
                'name' => $leaf['name'],
                'character' => [
                    'id' => $leaf['character_id'],
                    'name' => $leaf['character_name'],
                ],
            ],
            $leafRows
        );

        return new JsonResponse($payload, JsonResponse::HTTP_OK);
    }

    #[Route('/requirements/objects', name: 'requirement_objects', methods: ['GET'])]
    public function listRequirementObjects(Request $request, CharacterObjectCatalog $catalog): JsonResponse
    {
        $characterName = $this->normalizeStringFilter($request->query->get('characterName'));

        return new JsonResponse($catalog->listForApi($characterName), JsonResponse::HTTP_OK);
    }

    private function normalizeStringFilter(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return '' === $trimmed ? null : $trimmed;
    }

    private function normalizeIntegerFilter(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value;
        }

        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);
        if ('' === $trimmed || !preg_match('/^-?\d+$/', $trimmed)) {
            return null;
        }

        return (int) $trimmed;
    }

    private function normalizeFloatFilter(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);
        if ('' === $trimmed || !is_numeric($trimmed)) {
            return null;
        }

        return (float) $trimmed;
    }

    private function normalizeBooleanFilter(mixed $value): ?bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            $normalized = mb_strtolower(trim($value));
            if ('true' === $normalized || '1' === $normalized) {
                return true;
            }
            if ('false' === $normalized || '0' === $normalized) {
                return false;
            }
        }

        return null;
    }

    private function normalizeSortFilter(mixed $value): string
    {
        if (!is_string($value)) {
            return 'resourceAdjustedDamage';
        }

        $trimmed = trim($value);

        return in_array($trimmed, ['damage', 'resourceAdjustedDamage', 'driveCost', 'minimumDriveCost', 'minimumDriveCostNoBurnout', 'superCost', 'driveGain', 'superGain', 'seasonStartDate'], true)
            ? $trimmed
            : 'resourceAdjustedDamage';
    }

    private function normalizeSortDirectionFilter(mixed $value): string
    {
        if (!is_string($value)) {
            return 'desc';
        }

        return 'asc' === mb_strtolower(trim($value)) ? 'asc' : 'desc';
    }


    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request $request,
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $typeName = $data['type'] ?? null;
        if (!in_array($typeName, ['combo', 'sequence'])) {
            throw new BadRequestHttpException('Only combo and sequence types are allowed to be created via API');
        }

        if (!empty($data['move'])) {
            throw new BadRequestHttpException('Leaf sequences cannot be created via API');
        }

        $sequence = $this->comboSequenceCreationService->createFromPayload((array) $data, $typeName, null, $actor);
        $this->moderationTransitionService->submitComboForReview($sequence);
        if (array_key_exists('isEssential', $data)) {
            try {
                $this->endpointAuthorizationService->assertCanManageEssentialFlag($actor);
            } catch (AccessDeniedHttpException) {
                return new JsonResponse(['error' => 'Forbidden'], JsonResponse::HTTP_FORBIDDEN);
            }
            $sequence->setIsEssential($this->normalizeEssentialValue($data['isEssential']));
        }

        $this->entityManager->flush();

        return new JsonResponse(
            $this->serializer->serialize($sequence, 'json', ['groups' => ['combo:read']]),
            JsonResponse::HTTP_CREATED,
            [],
            true
        );
    }

    #[Route('/full', name: 'create_full', methods: ['POST'])]
    public function createFullCombo(
        Request $request,
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        // 1. Validate required top-level fields
        if (empty($data['name']) || empty($data['steps']) || !is_array($data['steps'])) {
            throw new BadRequestHttpException('Name and steps are required.');
        }

        $sequence = $this->comboSequenceCreationService->createFromPayload((array) $data, 'combo', $data['steps'], $actor);
        $this->moderationTransitionService->submitComboForReview($sequence);
        if (array_key_exists('isEssential', $data)) {
            try {
                $this->endpointAuthorizationService->assertCanManageEssentialFlag($actor);
            } catch (AccessDeniedHttpException) {
                return new JsonResponse(['error' => 'Forbidden'], JsonResponse::HTTP_FORBIDDEN);
            }
            $sequence->setIsEssential($this->normalizeEssentialValue($data['isEssential']));
        }

        $this->entityManager->flush();

        return new JsonResponse(
            $this->serializer->serialize($sequence, 'json', ['groups' => ['combo:read']]),
            JsonResponse::HTTP_CREATED,
            [],
            true
        );
    }

    #[Route('/translate', name: 'translate', methods: ['POST'])]
    public function translate(
        Request $request,
        CharacterRepository $characterRepository,
        ComboNotationTranslator $comboNotationTranslator,
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        $characterId = $data['characterId'] ?? null;
        if (!is_string($characterId) && !is_int($characterId)) {
            throw new BadRequestHttpException('characterId must be a string or integer.');
        }

        $characterId = trim((string) $characterId);
        if ('' === $characterId) {
            throw new BadRequestHttpException('characterId must not be empty.');
        }

        $notation = $data['notation'] ?? null;
        if (!is_string($notation) || '' === trim($notation)) {
            throw new BadRequestHttpException('notation must be a non-empty string.');
        }

        $starterExtraction = (new ComboStarterModifierExtractor())->extract($notation);
        $canonicalization = $this->notationCanonicalizer->canonicalize($starterExtraction['notation']);

        $character = $characterRepository->find($characterId);
        if (null === $character) {
            throw new NotFoundHttpException(sprintf('Character ID %s not found.', $characterId));
        }

        $leafOptions = [];
        foreach ($this->comboSequencesRepository->findLeafsByCharacterId($characterId) as $leafSequence) {
            $move = $leafSequence->getMove();
            if (!$move instanceof Move) {
                continue;
            }

            $leafOptions[] = [
                'id' => (int) $leafSequence->getId(),
                'notation' => $move->getNumpadNotation(),
                'moveType' => $move->getFrameData()?->getMoveType(),
                'cancelTypeCodes' => $this->getCancelTypeCodesForTranslation($move->getFrameData()),
            ];
        }

        $connectionTypes = array_map(
            static fn (ConnectionType $connectionType): array => [
                'id' => (int) $connectionType->getId(),
                'name' => (string) $connectionType->getName(),
            ],
            $this->connectionTypeRepository->findAll()
        );

        $translated = $comboNotationTranslator->translateNotationToInternalSteps(
            $canonicalization['canonicalNotation'],
            $leafOptions,
            $connectionTypes
        );

        $translated['input'] = [
            'rawNotation' => $notation,
            'canonicalNotation' => $canonicalization['canonicalNotation'],
            'tokenMap' => $canonicalization['tokenMap'],
        ];
        $translated['requirements'] = array_merge(
            $starterExtraction['requirements'],
            ['not_crouching_required' => $this->comboCrouchRequirementInferenceService->requiresOpponentNotCrouching($translated['steps'] ?? [])]
        );

        return new JsonResponse($translated, JsonResponse::HTTP_OK);
    }

    #[Route('/estimate-damage', name: 'estimate_damage', methods: ['POST'])]
    public function estimateDamage(
        Request $request,
        CharacterRepository $characterRepository,
        ComboNotationTranslator $comboNotationTranslator,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        $characterId = $data['characterId'] ?? null;
        if (!is_string($characterId) && !is_int($characterId)) {
            throw new BadRequestHttpException('characterId must be a string or integer.');
        }

        $characterId = trim((string) $characterId);
        if ('' === $characterId) {
            throw new BadRequestHttpException('characterId must not be empty.');
        }

        $notation = $data['notation'] ?? null;
        if (!is_string($notation) || '' === trim($notation)) {
            throw new BadRequestHttpException('notation must be a non-empty string.');
        }

        $character = $characterRepository->find($characterId);
        if (null === $character) {
            throw new NotFoundHttpException(sprintf('Character ID %s not found.', $characterId));
        }

        $leafOptions = [];
        foreach ($this->comboSequencesRepository->findLeafsByCharacterId($characterId) as $leafSequence) {
            $move = $leafSequence->getMove();
            if (!$move instanceof Move) {
                continue;
            }

            $leafOptions[] = [
                'id' => (int) $leafSequence->getId(),
                'notation' => $move->getNumpadNotation(),
                'moveType' => $move->getFrameData()?->getMoveType(),
                'cancelTypeCodes' => $this->getCancelTypeCodesForTranslation($move->getFrameData()),
            ];
        }

        $connectionTypes = array_map(
            static fn (ConnectionType $connectionType): array => [
                'id' => (int) $connectionType->getId(),
                'name' => (string) $connectionType->getName(),
            ],
            $this->connectionTypeRepository->findAll()
        );

        $starterExtraction = (new ComboStarterModifierExtractor())->extract($notation);
        $canonicalization = $this->notationCanonicalizer->canonicalize($starterExtraction['notation']);
        $translated = $comboNotationTranslator->translateNotationToInternalSteps(
            $canonicalization['canonicalNotation'],
            $leafOptions,
            $connectionTypes
        );

        $moveByLeafId = [];
        foreach ($this->comboSequencesRepository->findBy(['id' => array_column($leafOptions, 'id')]) as $leafSequence) {
            if (!$leafSequence instanceof ComboSequences) {
                continue;
            }

            $leafId = $leafSequence->getId();
            $move = $leafSequence->getMove();
            if (null === $leafId || !$move instanceof Move || null === $move->getFrameData()?->getDamage()) {
                continue;
            }

            $frameData = $move->getFrameData();

            $moveByLeafId[$leafId] = [
                'damage' => (int) $frameData->getDamage(),
                'moveType' => (string) $frameData->getMoveType(),
                'notation' => (string) $move->getNumpadNotation(),
                'scalingStartPercent' => $frameData->getScalingStartPercent(),
                'scalingImmediatePercent' => $frameData->getScalingImmediatePercent(),
                'scalingMinimumPercent' => $frameData->getScalingMinimumPercent(),
                'scalingComboHits' => $frameData->getScalingComboHits(),
                'scalingComboExtraPercent' => $frameData->getScalingComboExtraPercent(),
                'scalingMultiplierPercent' => $frameData->getScalingMultiplierPercent(),
                'damageParts' => $this->getDamageParts($frameData->getExtraInformation()),
            ];
        }

        $resolvedMoves = [];
        foreach ($translated['steps'] as $step) {
            if (!is_array($step)) {
                continue;
            }

            $childSequenceId = isset($step['child_sequence_id']) ? (int) $step['child_sequence_id'] : 0;
            if ($childSequenceId <= 0 || !isset($moveByLeafId[$childSequenceId])) {
                continue;
            }

            $move = $moveByLeafId[$childSequenceId];
            $move['connectionTypeName'] = isset($step['connection_type_name']) && is_string($step['connection_type_name'])
                ? $step['connection_type_name']
                : null;
            $resolvedMoves[] = $move;
        }

        $options = is_array($data['options'] ?? null) ? $data['options'] : [];
        $options['starterHitState'] = $starterExtraction['starterHitState'];

        $estimation = $this->sf6ComboDamageEstimatorService->estimate($resolvedMoves, $options);

        return new JsonResponse([
            'estimatedDamage' => $estimation['estimatedDamage'],
            'stepDamages' => $estimation['stepDamages'],
            'warnings' => array_values(array_unique(array_merge($translated['warnings'] ?? [], $estimation['warnings']))),
            'errors' => $translated['errors'] ?? [],
            'parsedTokens' => $translated['parsedTokens'] ?? [],
            'steps' => $translated['steps'] ?? [],
            'requirements' => $starterExtraction['requirements'],
            'input' => [
                'rawNotation' => $notation,
                'canonicalNotation' => $canonicalization['canonicalNotation'],
                'tokenMap' => $canonicalization['tokenMap'],
            ],
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/estimate-resources', name: 'estimate_resources', methods: ['POST'])]
    public function estimateResources(
        Request $request,
        CharacterRepository $characterRepository,
        ComboNotationTranslator $comboNotationTranslator,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        $characterId = $data['characterId'] ?? null;
        if (!is_string($characterId) && !is_int($characterId)) {
            throw new BadRequestHttpException('characterId must be a string or integer.');
        }

        $characterId = trim((string) $characterId);
        if ('' === $characterId) {
            throw new BadRequestHttpException('characterId must not be empty.');
        }

        $notation = $data['notation'] ?? null;
        $notation = is_string($notation) ? trim($notation) : '';
        $stepsPayload = $data['steps'] ?? null;
        if ('' === $notation && !is_array($stepsPayload)) {
            throw new BadRequestHttpException('notation must be a non-empty string or steps must be a non-empty array.');
        }

        $character = $characterRepository->find($characterId);
        if (null === $character) {
            throw new NotFoundHttpException(sprintf('Character ID %s not found.', $characterId));
        }

        $leafOptions = [];
        foreach ($this->comboSequencesRepository->findLeafsByCharacterId($characterId) as $leafSequence) {
            $move = $leafSequence->getMove();
            if (!$move instanceof Move) {
                continue;
            }

            $leafOptions[] = [
                'id' => (int) $leafSequence->getId(),
                'notation' => $move->getNumpadNotation(),
                'moveType' => $move->getFrameData()?->getMoveType(),
                'cancelTypeCodes' => $this->getCancelTypeCodesForTranslation($move->getFrameData()),
            ];
        }

        $connectionTypes = array_map(
            static fn (ConnectionType $connectionType): array => [
                'id' => (int) $connectionType->getId(),
                'name' => (string) $connectionType->getName(),
            ],
            $this->connectionTypeRepository->findAll()
        );

        $starterExtraction = ['requirements' => []];
        $canonicalization = ['canonicalNotation' => '', 'tokenMap' => []];
        if ('' !== $notation) {
            $starterExtraction = (new ComboStarterModifierExtractor())->extract($notation);
            $canonicalization = $this->notationCanonicalizer->canonicalize($starterExtraction['notation']);
            $translated = $comboNotationTranslator->translateNotationToInternalSteps(
                $canonicalization['canonicalNotation'],
                $leafOptions,
                $connectionTypes
            );
        } else {
            $translated = [
                'steps' => $this->normalizeResourceEstimateSteps($stepsPayload, $connectionTypes),
                'warnings' => [],
                'errors' => [],
                'parsedTokens' => [],
            ];
        }

        $moveByLeafId = [];
        foreach ($this->comboSequencesRepository->findBy(['id' => array_column($leafOptions, 'id')]) as $leafSequence) {
            if (!$leafSequence instanceof ComboSequences) {
                continue;
            }

            $leafId = $leafSequence->getId();
            $move = $leafSequence->getMove();
            $frameData = $move?->getFrameData();
            if (null === $leafId || !$move instanceof Move || null === $frameData) {
                continue;
            }

            $moveByLeafId[$leafId] = [
                'moveType' => (string) $frameData->getMoveType(),
                'notation' => (string) $move->getNumpadNotation(),
                'driveGain' => $frameData->getDriveGain(),
                'onHitSelfSuperMeterGain' => $frameData->getOnHitSelfSuperMeterGain(),
                'startup' => $frameData->getStartup(),
                'active' => $frameData->getActive(),
                'hitstop' => $frameData->getHitstop(),
                'recovery' => $frameData->getRecovery(),
            ];
        }

        $resolvedMoves = [];
        foreach ($translated['steps'] as $step) {
            if (!is_array($step)) {
                continue;
            }

            $childSequenceId = isset($step['child_sequence_id']) ? (int) $step['child_sequence_id'] : 0;
            if ($childSequenceId <= 0 || !isset($moveByLeafId[$childSequenceId])) {
                continue;
            }

            $move = $moveByLeafId[$childSequenceId];
            $move['connectionTypeName'] = isset($step['connection_type_name']) && is_string($step['connection_type_name'])
                ? $step['connection_type_name']
                : null;
            $resolvedMoves[] = $move;
        }

        $estimation = $this->sf6ComboResourceEstimatorService->estimate($resolvedMoves);

        return new JsonResponse([
            'driveUsed' => $estimation['driveUsed'],
            'driveGain' => $estimation['driveGain'],
            'minimumDriveCost' => $estimation['minimumDriveCost'],
            'minimumDriveCostNoBurnout' => $estimation['minimumDriveCostNoBurnout'],
            'superUsed' => $estimation['superUsed'],
            'superGain' => $estimation['superGain'],
            'totalFrames' => $estimation['totalFrames'],
            'warnings' => array_values(array_unique(array_merge($translated['warnings'] ?? [], $estimation['warnings']))),
            'errors' => $translated['errors'] ?? [],
            'parsedTokens' => $translated['parsedTokens'] ?? [],
            'steps' => $translated['steps'] ?? [],
            'requirements' => $starterExtraction['requirements'],
            'input' => [
                'rawNotation' => $notation,
                'canonicalNotation' => $canonicalization['canonicalNotation'],
                'tokenMap' => $canonicalization['tokenMap'],
            ],
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'read', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function read(Request $request, ComboSequences $sequence): JsonResponse
    {
        if (!in_array($sequence->getType()?->getName(), ['combo', 'sequence'])) {
            throw new NotFoundHttpException('Not accessible');
        }

        if ($sequence->getModerationState() !== ModerationState::APPROVED->value) {
            $actor = $this->security->getUser();
            if (!$actor instanceof User) {
                throw new NotFoundHttpException('Not accessible');
            }

            try {
                $this->endpointAuthorizationService->assertCanMutateOwnedContent($actor, $sequence->getAuthor(), 'Not accessible');
            } catch (AccessDeniedHttpException) {
                throw new NotFoundHttpException('Not accessible');
            }
        }

        return new JsonResponse(
            $this->serializer->serialize($sequence, 'json', ['groups' => ['combo:read']]),
            JsonResponse::HTTP_OK,
            [],
            true
        );
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => '\\d+'], methods: ['PATCH'])]
    public function update(ComboSequences $sequence, Request $request): JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
            $this->endpointAuthorizationService->assertCanMutateOwnedContent($actor, $sequence->getAuthor());
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], JsonResponse::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        if (array_key_exists('isEssential', $data)) {
            try {
                $this->endpointAuthorizationService->assertCanManageEssentialFlag($actor);
            } catch (AccessDeniedHttpException) {
                return new JsonResponse(['error' => 'Forbidden'], JsonResponse::HTTP_FORBIDDEN);
            }
            $sequence->setIsEssential($this->normalizeEssentialValue($data['isEssential']));
            unset($data['isEssential']);
        }

        $this->comboSequenceUpdateService->updateFromPayload($sequence, $data);
        $this->moderationTransitionService->submitComboForReview($sequence);

        $this->entityManager->flush();

        return new JsonResponse(
            $this->serializer->serialize($sequence, 'json', ['groups' => ['combo:read']]),
            JsonResponse::HTTP_OK,
            [],
            true
        );
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => '\\d+'], methods: ['DELETE'])]
    public function delete(ComboSequences $sequence): JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
            $this->endpointAuthorizationService->assertCanMutateOwnedContent($actor, $sequence->getAuthor());
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], JsonResponse::HTTP_FORBIDDEN);
        }

        $this->entityManager->remove($sequence);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/moderation', name: 'moderate', requirements: ['id' => '\\d+'], methods: ['PATCH'])]
    public function moderate(ComboSequences $sequence, Request $request): JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
            $this->endpointAuthorizationService->assertCanModerateContent($actor);
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], JsonResponse::HTTP_FORBIDDEN);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload) || !isset($payload['state']) || !is_string($payload['state'])) {
            return new JsonResponse(['error' => 'state is required'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $reason = isset($payload['reason']) && is_string($payload['reason']) ? $payload['reason'] : null;
        $this->moderationTransitionService->moderateCombo($sequence, $actor, $payload['state'], $reason);
        $this->entityManager->flush();

        return new JsonResponse([
            'message' => 'Combo moderation updated',
            'moderationState' => $sequence->getModerationState(),
        ], JsonResponse::HTTP_OK);
    }

    private function normalizeEssentialValue(mixed $value): bool
    {
        if (!is_bool($value)) {
            throw new BadRequestHttpException('isEssential must be a boolean value.');
        }

        return $value;
    }

    /**
     * @param array<int, array{id:int, name:string}> $connectionTypes
     * @return list<array{child_sequence_id:int, ordinal_in_combo:int, connection_type_id:int|null, connection_type_name:string|null}>
     */
    private function normalizeResourceEstimateSteps(mixed $stepsPayload, array $connectionTypes): array
    {
        if (!is_array($stepsPayload) || [] === $stepsPayload) {
            throw new BadRequestHttpException('steps must be a non-empty array.');
        }

        $connectionNameById = [];
        foreach ($connectionTypes as $connectionType) {
            $connectionNameById[(int) $connectionType['id']] = (string) $connectionType['name'];
        }

        $steps = [];
        foreach ($stepsPayload as $index => $stepPayload) {
            if (!is_array($stepPayload)) {
                throw new BadRequestHttpException(sprintf('steps[%d] must be an object.', $index));
            }

            $childSequenceId = $stepPayload['child_sequence_id'] ?? null;
            if (!is_int($childSequenceId) || $childSequenceId <= 0) {
                throw new BadRequestHttpException(sprintf('steps[%d].child_sequence_id must be a positive integer.', $index));
            }

            $connectionTypeId = $stepPayload['connection_type_id'] ?? null;
            if (null !== $connectionTypeId && (!is_int($connectionTypeId) || $connectionTypeId <= 0)) {
                throw new BadRequestHttpException(sprintf('steps[%d].connection_type_id must be a positive integer or null.', $index));
            }

            $steps[] = [
                'child_sequence_id' => $childSequenceId,
                'ordinal_in_combo' => $index + 1,
                'connection_type_id' => $connectionTypeId,
                'connection_type_name' => null !== $connectionTypeId ? ($connectionNameById[$connectionTypeId] ?? null) : null,
            ];
        }

        return $steps;
    }

    /**
     * @return array<int, string>
     */
    private function getCancelTypeCodesForTranslation(?FrameData $frameData): array
    {
        if (null === $frameData) {
            return [];
        }

        $codes = $frameData->getCancelTypeCodes();
        if (($frameData->getHitConfirmTargetCombos() ?? 0) > 0 && !in_array('tc', $codes, true)) {
            $codes[] = 'tc';
        }

        return $codes;
    }

    /**
     * @return list<int>
     */
    private function getDamageParts(?string $extraInformation): array
    {
        if (null === $extraInformation) {
            return [];
        }

        $decoded = json_decode($extraInformation, true);
        if (!is_array($decoded)) {
            return [];
        }

        foreach ($decoded as $item) {
            if (!is_array($item) || !isset($item['fatDamageParts']) || !is_array($item['fatDamageParts'])) {
                continue;
            }

            $parts = [];
            foreach ($item['fatDamageParts'] as $part) {
                if (!is_int($part) || $part <= 0) {
                    return [];
                }

                $parts[] = $part;
            }

            return $parts;
        }

        return [];
    }
}
