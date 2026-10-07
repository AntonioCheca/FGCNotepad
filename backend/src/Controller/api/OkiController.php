<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\OkiProfile;
use App\Entity\User;
use App\Repository\MoveRepository;
use App\Repository\OkiProfileRepository;
use App\Service\EndpointAuthorizationService;
use App\Service\OkiProfileMutationService;
use App\Service\OkiSetupAccessService;
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
use Symfony\Component\Uid\Uuid;

#[Route('/api/okis', name: 'api_okis_')]
final class OkiController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly OkiProfileRepository $okiProfileRepository,
        private readonly MoveRepository $moveRepository,
        private readonly OkiResponseBuilder $responseBuilder,
        private readonly OkiProfileMutationService $mutationService,
        private readonly OkiSetupAccessService $accessService,
        private readonly EndpointAuthorizationService $authorizationService,
        private readonly Security $security,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $filters = [
            'characterId' => $this->normalizeString($request->query->get('characterId')),
            'moveId' => $this->normalizeString($request->query->get('moveId')),
        ];

        $viewer = $this->currentUser();
        $profiles = $this->okiProfileRepository->searchByFilters($filters, $request->query->getInt('size', 100), $viewer, $this->accessService->canModerate($viewer));

        return new JsonResponse($this->responseBuilder->buildList($profiles, $viewer), JsonResponse::HTTP_OK);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $actor = $this->requireAuthenticated();
        $payload = $this->decodePayload($request);
        $moveId = $this->normalizeString($payload['moveId'] ?? null);
        $existing = null !== $moveId && Uuid::isValid($moveId) ? $this->okiProfileRepository->findOneBy(['move' => $moveId]) : null;
        if ($existing instanceof OkiProfile) {
            return new JsonResponse(['error' => 'This ender already has an oki; add setups to it instead.', 'id' => $existing->getId()], JsonResponse::HTTP_CONFLICT);
        }
        $profile = new OkiProfile();

        try {
            $this->entityManager->getConnection()->transactional(function () use ($profile, $payload, $actor): void {
                $this->mutationService->hydrateProfile($profile, $payload, $actor);
                $this->entityManager->persist($profile);
                $this->entityManager->flush();
            });
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], JsonResponse::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->responseBuilder->buildDetail($profile, $actor), JsonResponse::HTTP_CREATED);
    }

    #[Route('/enders', name: 'enders', methods: ['GET'])]
    public function enders(Request $request): JsonResponse
    {
        $characterId = $this->normalizeString($request->query->get('characterId'));
        $query = $this->normalizeString($request->query->get('query'));
        if (null === $characterId || null === $query || !Uuid::isValid($characterId)) {
            return new JsonResponse([], JsonResponse::HTTP_OK);
        }

        return new JsonResponse($this->responseBuilder->buildEnderOptions($this->moveRepository->findOkiEnderCandidates($characterId, $query)), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'read', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function read(int $id): JsonResponse
    {
        $profile = $this->okiProfileRepository->findWithDetail($id);
        if (!$profile instanceof OkiProfile) {
            throw new NotFoundHttpException(sprintf('Oki profile %d not found.', $id));
        }

        $viewer = $this->currentUser();
        if ([] === $this->responseBuilder->visibleSetups($profile, $viewer) && !$profile->getSetups()->isEmpty()) {
            throw new NotFoundHttpException(sprintf('Oki profile %d not found.', $id));
        }

        return new JsonResponse($this->responseBuilder->buildDetail($profile, $viewer), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => '\\d+'], methods: ['PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $actor = $this->requireAuthenticated();
        $profile = $this->okiProfileRepository->findWithDetail($id);
        if (!$profile instanceof OkiProfile) {
            throw new NotFoundHttpException(sprintf('Oki profile %d not found.', $id));
        }

        try {
            $this->entityManager->getConnection()->transactional(function () use ($profile, $request, $actor): void {
                $this->mutationService->hydrateProfile($profile, $this->decodePayload($request), $actor);
                $this->entityManager->flush();
            });
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], JsonResponse::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->responseBuilder->buildDetail($profile, $actor), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => '\\d+'], methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $actor = $this->requireAuthenticated();
        $this->authorizationService->assertCanModerateContent($actor);
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

    private function currentUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
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
}
