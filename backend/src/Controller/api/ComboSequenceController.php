<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\ConnectionType;
use App\Entity\Move;
use App\Entity\Season;
use App\Entity\ComboSequenceType;
use App\Repository\CharacterRepository;
use App\Repository\ComboSequencesRepository;
use App\Repository\ConnectionTypeRepository;
use App\Repository\SeasonRepository;
use App\Repository\ComboSequenceTypeRepository;
use App\Repository\VisibilityRepository;
use App\Service\ComboNotationTranslator;
use App\Service\ComboRequirementFactory;
use App\Service\ComboStepFactory;
use App\Service\RequirementSpecificCharacterCatalog;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Route('/api/combo-sequences', name: 'api_combo_sequences_')]
class ComboSequenceController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface      $entityManager,
        private SerializerInterface         $serializer,
        private ValidatorInterface          $validator,
        private ComboSequencesRepository    $comboSequencesRepository,
        private VisibilityRepository        $visibilityRepository,
        private ComboSequenceTypeRepository $comboSequenceTypeRepository,
        private SeasonRepository            $seasonRepository,
        private ConnectionTypeRepository    $connectionTypeRepository,
        private ComboRequirementFactory     $comboRequirementFactory,
    )
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $sequences = $this->comboSequencesRepository->findAllNonLeafs();
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


    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request                     $request,
        ComboSequenceTypeRepository $typeRepo,
        SeasonRepository            $seasonRepo
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $typeName = $data['type'] ?? null;
        if (!in_array($typeName, ['combo', 'sequence'])) {
            throw new BadRequestHttpException('Only combo and sequence types are allowed to be created via API');
        }

        $type = $typeRepo->findOneBy(['name' => $typeName]);
        if (!$type) {
            throw new NotFoundHttpException("ComboSequenceType '$typeName' not found");
        }

        $sequence = new ComboSequences();
        $sequence->setName($data['name'] ?? '')
            ->setDescription($data['description'] ?? '')
            ->setType($type);

        if (!empty($data['move'])) {
            throw new BadRequestHttpException('Leaf sequences cannot be created via API');
        }

        $visibility = $this->visibilityRepository->findOneBy(['name' => $data['visibility'] ?? 'public']);
        $sequence->setVisibility($visibility);

        // Set Season
        $currentSeason = $seasonRepo->findOneBy([], ['start_date' => 'DESC']);
        if ($currentSeason) {
            $sequence->addSeason($currentSeason);
        }

        $this->entityManager->persist($sequence);

        // Metrics
        if (!empty($data['metrics']['damage'])) {
            $metrics = new ComboMetrics();
            $metrics->setSequence($sequence)
                ->setDamage($data['metrics']['damage']);
            $this->entityManager->persist($metrics);
        }

        // Requirements
        if (!empty($data['requirements'])) {
            try {
                $requirement = $this->comboRequirementFactory->createFromPayload($sequence, (array) $data['requirements']);
            } catch (InvalidArgumentException $exception) {
                throw new BadRequestHttpException($exception->getMessage(), $exception);
            }

            if ($requirement instanceof ComboRequirement) {
                $this->entityManager->persist($requirement);
            }
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
        Request                     $request,
        ComboSequenceTypeRepository $typeRepo,
        SeasonRepository            $seasonRepo,
        EntityManagerInterface      $em
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // 1. Validate required top-level fields
        if (empty($data['name']) || empty($data['steps']) || !is_array($data['steps'])) {
            throw new BadRequestHttpException('Name and steps are required.');
        }

        // 2. Main combo sequence type (must be "combo")
        $type = $typeRepo->findOneBy(['name' => 'combo']);
        if (!$type) {
            throw new NotFoundHttpException("ComboSequenceType 'combo' not found");
        }

        // 3. Create main combo sequence
        $sequence = new ComboSequences();
        $sequence->setName($data['name'])
            ->setDescription($data['description'] ?? '')
            ->setType($type);

        $visibility = $this->visibilityRepository->findOneBy(['name' => $data['visibility'] ?? 'public']);
        $sequence->setVisibility($visibility);

        // Add current season
        if ($season = $seasonRepo->findOneBy([], ['start_date' => 'DESC'])) {
            $sequence->addSeason($season);
        }

        $this->entityManager->persist($sequence);

        // 4. Add metrics (optional)
        if (!empty($data['metrics']['damage'])) {
            $metrics = new ComboMetrics();
            $metrics->setSequence($sequence)
                ->setDamage($data['metrics']['damage']);
            $this->entityManager->persist($metrics);
        }

        // 5. Add requirements (optional)
        if (!empty($data['requirements'])) {
            try {
                $requirement = $this->comboRequirementFactory->createFromPayload($sequence, (array) $data['requirements']);
            } catch (InvalidArgumentException $exception) {
                throw new BadRequestHttpException($exception->getMessage(), $exception);
            }

            if ($requirement instanceof ComboRequirement) {
                $this->entityManager->persist($requirement);
            }
        }

        // 6. Persist steps
        $comboStepFactory = new ComboStepFactory(
            $this->comboSequencesRepository,
            $this->connectionTypeRepository,
        );

        $steps = $comboStepFactory->createFromPayload($sequence, $data['steps']);
        foreach ($steps as $step) {
            $this->entityManager->persist($step);
        }

        // 7. Save everything
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
