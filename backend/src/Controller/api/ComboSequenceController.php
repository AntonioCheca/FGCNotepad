<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\Season;
use App\Entity\ComboSequenceType;
use App\Repository\ComboSequencesRepository;
use App\Repository\SeasonRepository;
use App\Repository\ComboSequenceTypeRepository;
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
        private EntityManagerInterface $entityManager,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(ComboSequencesRepository $repo): JsonResponse
    {
        $items = $repo->findAll();

        $filtered = array_filter($items, function (ComboSequences $seq) {
            return in_array($seq->getType()?->getName(), ['combo', 'sequence']);
        });

        return new JsonResponse(
            $this->serializer->serialize($filtered, 'json', ['groups' => ['combo:read']]),
            JsonResponse::HTTP_OK,
            [],
            true
        );
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request $request,
        ComboSequenceTypeRepository $typeRepo,
        SeasonRepository $seasonRepo
    ): JsonResponse {
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

        $visibility = $this->entityManager->getReference('App\\Entity\\Visibility', $data['visibility'] ?? 1);
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
