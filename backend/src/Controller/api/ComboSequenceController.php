<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\ConnectionType;
use App\Entity\Season;
use App\Entity\ComboSequenceType;
use App\Entity\Step;
use App\Repository\ComboSequencesRepository;
use App\Repository\ConnectionTypeRepository;
use App\Repository\SeasonRepository;
use App\Repository\ComboSequenceTypeRepository;
use App\Repository\VisibilityRepository;
use Doctrine\ORM\EntityManagerInterface;
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
        private ConnectionTypeRepository    $connectionTypeRepository
    )
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $sequences = $this->comboSequencesRepository->findAll();
        $json = $this->serializer->serialize($sequences, 'json');

        return new JsonResponse($json, 200, [], true);
    }

    #[Route('/leafs/list', name: 'leafs', methods: ['GET'])]
    public function listLeafs(ComboSequencesRepository $repo): JsonResponse
    {
        $leafs = $repo->findAllLeafs();

        if (!empty($leafs)) {
            error_log('Leaf example: ' . $leafs[0]->getName() . ' (' . $leafs[0]->getId() . ')');
        }

        // Debug: check which normalizer is being used
        error_log('Serializing with class: ' . get_class($this->serializer));

        // Explicitly serialize using your configured normalizers
        $json = $this->serializer->serialize($leafs, 'json');

        return new JsonResponse($json, 200, [], true);
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
            $req = new ComboRequirement();
            $req->setSequence($sequence)
                ->setCounterHitRequired($data['requirements']['counter_hit_required'] ?? false)
                ->setPunishCounterRequired($data['requirements']['punish_counter_required'] ?? false)
                ->setCornerRequired($data['requirements']['corner_required'] ?? false)
                ->setAirborneRequired($data['requirements']['airborne_required'] ?? false)
                ->setMidScreenRequired($data['requirements']['mid_screen_required'] ?? false);
            $this->entityManager->persist($req);
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
            $req = new ComboRequirement();
            $req->setSequence($sequence)
                ->setCounterHitRequired($data['requirements']['counter_hit_required'] ?? false)
                ->setPunishCounterRequired($data['requirements']['punish_counter_required'] ?? false)
                ->setCornerRequired($data['requirements']['corner_required'] ?? false)
                ->setAirborneRequired($data['requirements']['airborne_required'] ?? false)
                ->setMidScreenRequired($data['requirements']['mid_screen_required'] ?? false);
            $this->entityManager->persist($req);
        }

        // 6. Persist steps using repositories
        foreach ($data['steps'] as $stepData) {
            if (empty($stepData['child_sequence_id']) || empty($stepData['ordinal_in_combo'])) {
                throw new BadRequestHttpException('Each step must have child_sequence_id and ordinal_in_combo.');
            }

            $childSeq = $this->comboSequencesRepository->findOneBy(['id' => $stepData['child_sequence_id']]);
            if (!$childSeq) {
                throw new NotFoundHttpException("Child sequence ID {$stepData['child_sequence_id']} not found.");
            }

            $step = new Step();
            $step->setParentSequence($sequence)
                ->setChildSequence($childSeq)
                ->setOrdinalInCombo((int)$stepData['ordinal_in_combo']);

            if (!empty($stepData['connection_type_id'])) {
                $connectionType = $this->connectionTypeRepository->findOneBy(['id' => $stepData['connection_type_id']]);
                if (!$connectionType) {
                    throw new NotFoundHttpException("Connection type ID {$stepData['connection_type_id']} not found.");
                }
                $step->setConnectionType($connectionType);
            }

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

    #[Route('/{id}', name: 'read', methods: ['GET'])]
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

    #[Route('/{id}', name: 'update', methods: ['PATCH'])]
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

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(ComboSequences $sequence): JsonResponse
    {
        $this->entityManager->remove($sequence);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
