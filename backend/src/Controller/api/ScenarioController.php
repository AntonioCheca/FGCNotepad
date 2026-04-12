<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\Scenario;
use App\Repository\ScenarioRepository;
use App\Serializer\Denormalizer\ScenarioDenormalizer;
use App\Service\ScenarioResponseBuilder;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Uid\Uuid;

#[Route('/api/scenarios', name: 'api_scenarios_')]
class ScenarioController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private SerializerInterface    $serializer,
        private ValidatorInterface     $validator,
        private ScenarioRepository     $scenarioRepository,
        private ScenarioDenormalizer   $scenarioDenormalizer,
        private ScenarioResponseBuilder $scenarioResponseBuilder,
    )
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[Route('/', name: 'list_trailing_slash', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $query = $request->query->get('q', '');
        $limit = $request->query->getInt('size', 50);

        if (!is_string($query)) {
            return new JsonResponse(['error' => 'Query parameter q must be a string.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $scenarios = $this->scenarioRepository->searchByQuery($query, $limit);
        $data = $this->scenarioResponseBuilder->buildList($scenarios);

        return new JsonResponse($data, JsonResponse::HTTP_OK);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!$data) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        $scenario = $this->scenarioDenormalizer->denormalize($data, Scenario::class);

        $errors = $this->validator->validate($scenario);
        if (count($errors) > 0) {
            return new JsonResponse(['errors' => (string)$errors], JsonResponse::HTTP_BAD_REQUEST);
        }

        $this->entityManager->persist($scenario);
        $this->entityManager->flush();

        $json = $this->serializer->serialize($scenario, 'json');
        return new JsonResponse($json, JsonResponse::HTTP_CREATED, [], true);
    }

    #[Route('/{id}', name: 'read', methods: ['GET'])]
    public function read(string $id): JsonResponse
    {
        if (!Uuid::isValid($id)) {
            throw new NotFoundHttpException(sprintf('Scenario with ID %s not found', $id));
        }

        $scenario = $this->scenarioRepository->findOneByPublicId($id);
        if (!$scenario) {
            throw new NotFoundHttpException("Scenario with ID $id not found");
        }

        return new JsonResponse($this->scenarioResponseBuilder->buildDetail($scenario), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'update', methods: ['PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $scenario = $this->scenarioRepository->find($id);
        if (!$scenario) {
            throw new NotFoundHttpException("Scenario with ID $id not found");
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        if (isset($data['name'])) {
            $scenario->setName($data['name']);
        }
        if (isset($data['type'])) {
            // Optional: allow changing type
            $scenarioType = $this->entityManager->getRepository(\App\Entity\ScenarioType::class)
                ->findOneBy(['name' => $data['type']]);
            if (!$scenarioType) {
                $scenarioType = new \App\Entity\ScenarioType();
                $scenarioType->setName($data['type']);
                $this->entityManager->persist($scenarioType);
            }
            $scenario->setType($scenarioType);
        }

        $this->entityManager->flush();

        $json = $this->serializer->serialize($scenario, 'json');
        return new JsonResponse($json, JsonResponse::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $scenario = $this->scenarioRepository->find($id);
        if (!$scenario) {
            throw new NotFoundHttpException("Scenario with ID $id not found");
        }

        $this->entityManager->remove($scenario);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
