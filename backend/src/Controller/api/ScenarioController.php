<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\Scenario;
use App\Entity\User;
use App\Repository\CharacterRepository;
use App\Repository\MoveRepository;
use App\Repository\ScenarioRepository;
use App\Service\ScenarioMatrixMapper;
use App\Service\ScenarioResponseBuilder;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/api/scenarios', name: 'api_scenarios_')]
class ScenarioController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
        private readonly ScenarioRepository $scenarioRepository,
        private readonly CharacterRepository $characterRepository,
        private readonly MoveRepository $moveRepository,
        private readonly ScenarioResponseBuilder $scenarioResponseBuilder,
        private readonly ScenarioMatrixMapper $scenarioMatrixMapper,
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
        $data = $this->decodeRequestBody($request);
        $scenario = new Scenario();

        $this->hydrateScenario($scenario, $data, true);

        $user = $this->security->getUser();
        if ($user instanceof User) {
            $scenario->setAuthor($user);
        }

        $this->entityManager->persist($scenario);
        $this->entityManager->flush();

        return new JsonResponse($this->scenarioResponseBuilder->buildDetail($scenario), JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'read', methods: ['GET'])]
    public function read(string $id): JsonResponse
    {
        $scenario = $this->findByPublicId($id);

        return new JsonResponse($this->scenarioResponseBuilder->buildDetail($scenario), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'update', methods: ['PATCH'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $scenario = $this->findByPublicId($id);
        $data = $this->decodeRequestBody($request);

        $this->hydrateScenario($scenario, $data, false);

        $this->entityManager->flush();

        return new JsonResponse($this->scenarioResponseBuilder->buildDetail($scenario), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $scenario = $this->findByPublicId($id);

        $this->entityManager->remove($scenario);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function hydrateScenario(Scenario $scenario, array $data, bool $isCreate): void
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
            if (!in_array($normalizedScenarioType, ['oki', 'blockstun'], true)) {
                throw new BadRequestHttpException('scenarioType must be either oki or blockstun.');
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

            $this->scenarioMatrixMapper->replaceScenarioMatrixFromPayload($scenario, $matrix);
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
}
