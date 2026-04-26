<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ComboSequences;
use App\Util\Enum\MoveType;
use App\Entity\ConnectionType;
use App\Entity\Move;
use App\Repository\CharacterRepository;
use App\Repository\ComboSequencesRepository;
use App\Repository\ConnectionTypeRepository;
use App\Service\ComboNotationTranslator;
use App\Service\ComboSequenceCreationService;
use App\Service\RequirementSpecificCharacterCatalog;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Route('/api/combo-sequences', name: 'api_combo_sequences_')]
class ComboSequenceController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface      $entityManager,
        private SerializerInterface         $serializer,
        private ComboSequencesRepository    $comboSequencesRepository,
        private ConnectionTypeRepository    $connectionTypeRepository,
        private ComboSequenceCreationService $comboSequenceCreationService,
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
            'seasonId' => $this->normalizeIntegerFilter($request->query->get('seasonId')),
            'minDamage' => $this->normalizeIntegerFilter($request->query->get('minDamage')),
            'maxDamage' => $this->normalizeIntegerFilter($request->query->get('maxDamage')),
            'minDifficulty' => $this->normalizeIntegerFilter($request->query->get('minDifficulty')),
            'maxDifficulty' => $this->normalizeIntegerFilter($request->query->get('maxDifficulty')),
            'counterHitRequired' => $this->normalizeBooleanFilter($request->query->get('counterHitRequired')),
            'punishCounterRequired' => $this->normalizeBooleanFilter($request->query->get('punishCounterRequired')),
            'cornerRequired' => $this->normalizeBooleanFilter($request->query->get('cornerRequired')),
            'airborneRequired' => $this->normalizeBooleanFilter($request->query->get('airborneRequired')),
            'midScreenRequired' => $this->normalizeBooleanFilter($request->query->get('midScreenRequired')),
            'notCrouchingRequired' => $this->normalizeBooleanFilter($request->query->get('notCrouchingRequired')),
            'isEssential' => $this->normalizeBooleanFilter($request->query->get('isEssential')),
            'moveTypes' => array_values($normalizedMoveTypes),
        ];

        $limit = $request->query->getInt('size', 100);

        $sequences = $this->comboSequencesRepository->searchNonLeafsByFilters($filters, $limit);
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
    public function listRequirementObjects(RequirementSpecificCharacterCatalog $catalog): JsonResponse
    {
        return new JsonResponse($catalog->listForApi(), JsonResponse::HTTP_OK);
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


    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request $request,
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $typeName = $data['type'] ?? null;
        if (!in_array($typeName, ['combo', 'sequence'])) {
            throw new BadRequestHttpException('Only combo and sequence types are allowed to be created via API');
        }

        if (!empty($data['move'])) {
            throw new BadRequestHttpException('Leaf sequences cannot be created via API');
        }

        $sequence = $this->comboSequenceCreationService->createFromPayload((array) $data, $typeName);

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

        // 1. Validate required top-level fields
        if (empty($data['name']) || empty($data['steps']) || !is_array($data['steps'])) {
            throw new BadRequestHttpException('Name and steps are required.');
        }

        $sequence = $this->comboSequenceCreationService->createFromPayload((array) $data, 'combo', $data['steps']);

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
        ComboNotationTranslator $comboNotationTranslator
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
                'cancelTypeCodes' => $move->getFrameData()?->getCancelTypeCodes() ?? [],
            ];
        }

        $connectionTypes = array_map(
            static fn (ConnectionType $connectionType): array => [
                'id' => (int) $connectionType->getId(),
                'name' => (string) $connectionType->getName(),
            ],
            $this->connectionTypeRepository->findAll()
        );

        $translated = $comboNotationTranslator->translateNotationToInternalSteps($notation, $leafOptions, $connectionTypes);

        return new JsonResponse($translated, JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'read', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function read(ComboSequences $sequence): JsonResponse
    {
        if (!in_array($sequence->getType()?->getName(), ['combo', 'sequence'])) {
            throw new NotFoundHttpException('Not accessible');
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
        $data = json_decode($request->getContent(), true);

        if (isset($data['type'])) {
            throw new BadRequestHttpException('Cannot change type of ComboSequence');
        }

        $sequence->setName($data['name'] ?? $sequence->getName());
        $sequence->setDescription($data['description'] ?? $sequence->getDescription());

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
        $this->entityManager->remove($sequence);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
