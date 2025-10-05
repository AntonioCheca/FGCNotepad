<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\Scenario;
use App\Repository\ScenarioRepository;
use App\Serializer\Denormalizer\ScenarioDenormalizer;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

#[Route('/api/scenarios', name: 'api_scenarios_')]
class ScenarioController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private SerializerInterface    $serializer,
        private ValidatorInterface     $validator,
        private ScenarioRepository     $scenarioRepository,
        private ScenarioDenormalizer   $scenarioDenormalizer
    )
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $scenarios = $this->scenarioRepository->findAll();
        $json = $this->serializer->serialize($scenarios, 'json');

        return new JsonResponse($json, JsonResponse::HTTP_OK, [], true);
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
    public function read(int $id): JsonResponse
    {
        $scenario = $this->scenarioRepository->find($id);
        if (!$scenario) {
            throw new NotFoundHttpException("Scenario with ID $id not found");
        }

        $json = $this->serializer->serialize($scenario, 'json');
        return new JsonResponse($json, JsonResponse::HTTP_OK, [], true);
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
