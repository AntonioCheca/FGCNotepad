<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\User;
use App\Entity\UserCombo;
use App\Entity\UserScenarioPreference;
use App\Repository\CharacterRepository;
use App\Repository\ComboSequencesRepository;
use App\Repository\UserComboRepository;
use App\Repository\UserScenarioPreferenceRepository;
use App\Service\ComboRecommendationService;
use App\Service\ComboNotationDictionaryTranslator;
use App\Service\NotationDictionaryPreferenceService;
use App\Service\ScenarioExecutionModeService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/profile', name: 'api_profile_')]
class ProfileController extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly EntityManagerInterface $entityManager,
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly CharacterRepository $characterRepository,
        private readonly UserComboRepository $userComboRepository,
        private readonly UserScenarioPreferenceRepository $userScenarioPreferenceRepository,
        private readonly ScenarioExecutionModeService $scenarioExecutionModeService,
        private readonly ComboRecommendationService $comboRecommendationService,
        private readonly NotationDictionaryPreferenceService $notationDictionaryPreferenceService,
        private readonly ComboNotationDictionaryTranslator $comboNotationDictionaryTranslator,
    ) {
    }

    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->requireUser();

        return new JsonResponse([
            'id' => $user->getId()?->toRfc4122(),
            'username' => $user->getUsername(),
            'roles' => $user->getRoles(),
            'isActive' => $user->isActive(),
            'notationDictionary' => $this->notationDictionaryPreferenceService->resolveForUser($user),
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/notation-preference', name: 'notation_preference_get', methods: ['GET'])]
    public function getNotationPreference(): JsonResponse
    {
        $user = $this->requireUser();

        return new JsonResponse([
            'notationDictionary' => $this->notationDictionaryPreferenceService->resolveForUser($user),
            'supportedDictionaries' => $this->comboNotationDictionaryTranslator->supportedDictionaries(),
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/notation-preference', name: 'notation_preference_update', methods: ['PUT'])]
    public function updateNotationPreference(Request $request): JsonResponse
    {
        $user = $this->requireUser();
        $data = json_decode((string) $request->getContent(), true);

        if (!is_array($data)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        $dictionary = isset($data['notationDictionary']) && is_string($data['notationDictionary'])
            ? $this->comboNotationDictionaryTranslator->normalizeDictionary($data['notationDictionary'])
            : ComboNotationDictionaryTranslator::DICTIONARY_NUMPAD;

        $preference = $this->userScenarioPreferenceRepository->findOneByUser($user);
        if (null === $preference) {
            $preference = (new UserScenarioPreference())->setUser($user);
            $this->entityManager->persist($preference);
        }

        $preference->setNotationDictionary($dictionary);
        $this->entityManager->flush();

        return new JsonResponse([
            'notationDictionary' => $dictionary,
            'supportedDictionaries' => $this->comboNotationDictionaryTranslator->supportedDictionaries(),
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/combo-knowledge', name: 'combo_knowledge_get', methods: ['GET'])]
    public function getComboKnowledge(Request $request): JsonResponse
    {
        $user = $this->requireUser();
        $characterId = trim((string) $request->query->get('characterId', ''));

        $characters = $this->comboSequencesRepository->findCharacterSummariesWithCombos();

        if ('' === $characterId && [] !== $characters) {
            $characterId = $characters[0]['id'];
        }

        $combos = [];
        if ('' !== $characterId) {
            $knownByComboId = [];
            $userId = $user->getId();
            if (null !== $userId) {
                foreach ($this->userComboRepository->findKnownComboIdsByUserAndCharacterId($userId, $characterId) as $knownComboId) {
                    $knownByComboId[$knownComboId] = true;
                }
            }

            foreach ($this->comboSequencesRepository->findComboKnowledgeRowsByCharacterId($characterId) as $comboRow) {
                $comboId = $comboRow['id'];
                $combos[] = [
                    'id' => $comboId,
                    'name' => $comboRow['name'],
                    'difficultyLevel' => $comboRow['difficultyLevel'],
                    'damage' => $comboRow['damage'],
                    'known' => isset($knownByComboId[$comboId]),
                ];
            }
        }

        return new JsonResponse([
            'characters' => $characters,
            'selectedCharacterId' => '' !== $characterId ? $characterId : null,
            'combos' => $combos,
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/combo-knowledge', name: 'combo_knowledge_update', methods: ['PUT'])]
    public function updateComboKnowledge(Request $request): JsonResponse
    {
        $user = $this->requireUser();
        $data = json_decode((string) $request->getContent(), true);

        if (!is_array($data)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        $characterId = isset($data['characterId']) && is_string($data['characterId']) ? trim($data['characterId']) : '';
        if ('' === $characterId) {
            throw new BadRequestHttpException('characterId is required.');
        }

        $character = $this->characterRepository->find($characterId);
        if (null === $character) {
            throw new BadRequestHttpException(sprintf('Character %s was not found.', $characterId));
        }

        $knownComboIdsRaw = $data['knownComboIds'] ?? null;
        if (!is_array($knownComboIdsRaw)) {
            throw new BadRequestHttpException('knownComboIds must be an array.');
        }

        $knownComboIds = array_values(array_unique(array_map(static fn (mixed $value): int => (int) $value, array_filter(
            $knownComboIdsRaw,
            static fn (mixed $value): bool => is_int($value) || (is_string($value) && is_numeric($value))
        ))));

        $comboRows = $this->comboSequencesRepository->findComboKnowledgeRowsByCharacterId($characterId);
        $allowedComboIds = [];
        foreach ($comboRows as $comboRow) {
            $allowedComboIds[(int) $comboRow['id']] = true;
        }

        $filteredKnownComboIds = array_values(array_filter(
            $knownComboIds,
            static fn (int $comboId): bool => isset($allowedComboIds[$comboId])
        ));

        $existingRows = $this->userComboRepository->findByUserAndCharacter($user, $character);
        foreach ($existingRows as $row) {
            $this->entityManager->remove($row);
        }
        $this->entityManager->flush();

        foreach ($filteredKnownComboIds as $comboId) {
            $combo = $this->comboSequencesRepository->find($comboId);
            if (null === $combo) {
                continue;
            }

            $userCombo = (new UserCombo())
                ->setUser($user)
                ->setCharacter($character)
                ->setCombo($combo)
                ->setKnown(true);

            $this->entityManager->persist($userCombo);
        }

        $this->entityManager->flush();

        return new JsonResponse([
            'characterId' => $characterId,
            'knownComboIds' => $filteredKnownComboIds,
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/execution-preference', name: 'execution_preference_get', methods: ['GET'])]
    public function getExecutionPreference(): JsonResponse
    {
        $user = $this->requireUser();
        $preference = $this->userScenarioPreferenceRepository->findOneByUser($user);

        $mode = $this->scenarioExecutionModeService->normalizeMode($preference?->getDefaultMode(), true);
        $difficultyCap = $this->scenarioExecutionModeService->normalizeDifficultyCap($preference?->getDifficultyCap());

        return new JsonResponse([
            'defaultMode' => $mode,
            'difficultyCap' => $difficultyCap,
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/execution-preference', name: 'execution_preference_update', methods: ['PUT'])]
    public function updateExecutionPreference(Request $request): JsonResponse
    {
        $user = $this->requireUser();
        $data = json_decode((string) $request->getContent(), true);

        if (!is_array($data)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        $mode = $this->scenarioExecutionModeService->normalizeMode(
            isset($data['defaultMode']) && is_string($data['defaultMode']) ? $data['defaultMode'] : null,
            true
        );
        $difficultyCap = $this->scenarioExecutionModeService->normalizeDifficultyCap($data['difficultyCap'] ?? null);

        $preference = $this->userScenarioPreferenceRepository->findOneByUser($user);
        if (null === $preference) {
            $preference = (new UserScenarioPreference())->setUser($user);
            $this->entityManager->persist($preference);
        }

        $preference->setDefaultMode($mode);
        $preference->setDifficultyCap(ScenarioExecutionModeService::MODE_DIFFICULTY_CAP === $mode ? $difficultyCap : null);
        $this->entityManager->flush();

        return new JsonResponse([
            'defaultMode' => $mode,
            'difficultyCap' => $preference->getDifficultyCap(),
        ], JsonResponse::HTTP_OK);
    }

    #[Route('/combo-recommendations', name: 'combo_recommendations_get', methods: ['GET'])]
    public function getComboRecommendations(Request $request): JsonResponse
    {
        $user = $this->requireUser();
        $characterId = trim((string) $request->query->get('characterId', ''));

        if ('' === $characterId) {
            throw new BadRequestHttpException('characterId is required.');
        }

        $character = $this->characterRepository->find($characterId);
        if (null === $character) {
            throw new BadRequestHttpException(sprintf('Character %s was not found.', $characterId));
        }

        $difficultyCap = $this->scenarioExecutionModeService->normalizeDifficultyCap($request->query->get('difficultyCap'));
        if (null === $difficultyCap) {
            throw new BadRequestHttpException('difficultyCap is required and must be an integer greater than or equal to 1.');
        }

        $result = $this->comboRecommendationService->recommend($user, $characterId, $difficultyCap);

        $recommendations = array_map(
            static fn (array $recommendation): array => [
                'comboId' => $recommendation['comboId'],
                'comboName' => $recommendation['comboName'],
                'comboLink' => sprintf('/combos?highlightComboId=%d', $recommendation['comboId']),
                'averageEvGainPerScenario' => $recommendation['averageEvGainPerScenario'],
            ],
            $result['recommendations']
        );

        return new JsonResponse([
            'characterId' => $characterId,
            'difficultyCap' => $difficultyCap,
            'essentialScenarioCount' => $result['essentialScenarioCount'],
            'recommendations' => $recommendations,
        ], JsonResponse::HTTP_OK);
    }

    private function requireUser(): User
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            throw new UnauthorizedHttpException('Session', 'Authentication required.');
        }

        return $user;
    }
}
