<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\CharacterReversal;
use App\Entity\OkiProfile;
use App\Entity\User;
use App\Repository\CharacterReversalRepository;
use App\Repository\OkiProfileRepository;
use App\Service\EndpointAuthorizationService;
use App\Service\OkiProfileMutationService;
use App\Service\OkiResponseBuilder;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/okis', name: 'api_okis_')]
final class OkiController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly OkiProfileRepository $okiProfileRepository,
        private readonly CharacterReversalRepository $characterReversalRepository,
        private readonly OkiResponseBuilder $responseBuilder,
        private readonly OkiProfileMutationService $mutationService,
        private readonly EndpointAuthorizationService $authorizationService,
        private readonly Security $security,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $filters = [
            'q' => $this->normalizeString($request->query->get('q')),
            'characterId' => $this->normalizeString($request->query->get('characterId')),
            'moveId' => $this->normalizeString($request->query->get('moveId')),
            'usesDriveRush' => $this->normalizeBoolean($request->query->get('usesDriveRush')),
            'autoTimed' => $this->normalizeBoolean($request->query->get('autoTimed')),
            'cornerOnly' => $this->normalizeBoolean($request->query->get('cornerOnly')),
            'worksNoBackroll' => $this->normalizeBoolean($request->query->get('worksNoBackroll')),
            'worksBackroll' => $this->normalizeBoolean($request->query->get('worksBackroll')),
            'hasFakeSetups' => $this->normalizeBoolean($request->query->get('hasFakeSetups')),
            'optionType' => $this->normalizeString($request->query->get('optionType')),
            'property' => $this->normalizeString($request->query->get('property')),
        ];

        $profiles = $this->okiProfileRepository->searchByFilters($filters, $request->query->getInt('size', 100));

        return new JsonResponse($this->responseBuilder->buildList($profiles), JsonResponse::HTTP_OK);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->requireAuthenticated();
        $payload = $this->decodePayload($request);
        $profile = new OkiProfile();

        try {
            $this->entityManager->getConnection()->transactional(function () use ($profile, $payload): void {
                $this->mutationService->hydrateProfile($profile, $payload);
                $this->entityManager->persist($profile);
                $this->entityManager->flush();
            });
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], JsonResponse::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->responseBuilder->buildDetail($profile), JsonResponse::HTTP_CREATED);
    }

    #[Route('/reversals', name: 'reversal_list', methods: ['GET'])]
    public function listReversals(Request $request): JsonResponse
    {
        $criteria = [];
        $characterId = $this->normalizeString($request->query->get('characterId'));
        if (null !== $characterId) {
            $criteria['character'] = $characterId;
        }

        $reversals = $this->characterReversalRepository->findBy($criteria, ['id' => 'ASC']);

        return new JsonResponse($this->responseBuilder->buildReversalList($reversals), JsonResponse::HTTP_OK);
    }

    #[Route('/reversals', name: 'reversal_create', methods: ['POST'])]
    public function createReversal(Request $request): JsonResponse
    {
        $this->requireAuthenticated();
        $payload = $this->decodePayload($request);
        $reversal = new CharacterReversal();

        try {
            $this->mutationService->hydrateReversal($reversal, $payload);
            $this->entityManager->persist($reversal);
            $this->entityManager->flush();
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], JsonResponse::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->responseBuilder->buildReversal($reversal), JsonResponse::HTTP_CREATED);
    }

    #[Route('/reversals/{id}', name: 'reversal_update', requirements: ['id' => '\\d+'], methods: ['PATCH'])]
    public function updateReversal(int $id, Request $request): JsonResponse
    {
        $this->requireAuthenticated();
        $reversal = $this->characterReversalRepository->find($id);
        if (!$reversal instanceof CharacterReversal) {
            throw new NotFoundHttpException(sprintf('Reversal %d not found.', $id));
        }

        try {
            $this->mutationService->hydrateReversal($reversal, $this->decodePayload($request));
            $this->entityManager->flush();
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], JsonResponse::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->responseBuilder->buildReversal($reversal), JsonResponse::HTTP_OK);
    }

    #[Route('/reversals/{id}', name: 'reversal_delete', requirements: ['id' => '\\d+'], methods: ['DELETE'])]
    public function deleteReversal(int $id): JsonResponse
    {
        $this->requireAuthenticated();
        $reversal = $this->characterReversalRepository->find($id);
        if (!$reversal instanceof CharacterReversal) {
            throw new NotFoundHttpException(sprintf('Reversal %d not found.', $id));
        }

        $this->entityManager->remove($reversal);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }

    #[Route('/{id}', name: 'read', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function read(int $id): JsonResponse
    {
        $profile = $this->okiProfileRepository->findWithDetail($id);
        if (!$profile instanceof OkiProfile) {
            throw new NotFoundHttpException(sprintf('Oki profile %d not found.', $id));
        }

        return new JsonResponse($this->responseBuilder->buildDetail($profile), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => '\\d+'], methods: ['PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $this->requireAuthenticated();
        $profile = $this->okiProfileRepository->findWithDetail($id);
        if (!$profile instanceof OkiProfile) {
            throw new NotFoundHttpException(sprintf('Oki profile %d not found.', $id));
        }

        try {
            $this->entityManager->getConnection()->transactional(function () use ($profile, $request): void {
                $this->mutationService->hydrateProfile($profile, $this->decodePayload($request));
                $this->entityManager->flush();
            });
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], JsonResponse::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->responseBuilder->buildDetail($profile), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => '\\d+'], methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $this->requireAuthenticated();
        $profile = $this->okiProfileRepository->find($id);
        if (!$profile instanceof OkiProfile) {
            throw new NotFoundHttpException(sprintf('Oki profile %d not found.', $id));
        }

        $this->entityManager->remove($profile);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }

    /** @return array<string, mixed> */
    private function decodePayload(Request $request): array
    {
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        return $payload;
    }

    private function requireAuthenticated(): User
    {
        try {
            return $this->authorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            throw new UnauthorizedHttpException('', 'Unauthorized');
        }
    }

    private function normalizeString(mixed $value): ?string
    {
        return is_string($value) && '' !== trim($value) ? trim($value) : null;
    }

    private function normalizeBoolean(mixed $value): ?bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if (!is_string($value)) {
            return null;
        }
        $normalized = mb_strtolower(trim($value));

        return match ($normalized) {
            'true', '1' => true,
            'false', '0' => false,
            default => null,
        };
    }
}
