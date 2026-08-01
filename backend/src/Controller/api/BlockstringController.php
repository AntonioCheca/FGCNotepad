<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\BlockstringSequence;
use App\Entity\User;
use App\Repository\BlockstringSequenceRepository;
use App\Service\BlockstringMutationService;
use App\Service\BlockstringResponseBuilder;
use App\Service\EndpointAuthorizationService;
use App\Service\ModerationTransitionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/blockstrings', name: 'api_blockstrings_')]
final class BlockstringController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly BlockstringSequenceRepository $repository,
        private readonly BlockstringResponseBuilder $responseBuilder,
        private readonly BlockstringMutationService $mutationService,
        private readonly EndpointAuthorizationService $authorizationService,
        private readonly ModerationTransitionService $moderationTransitionService,
        private readonly Security $security,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $actor = $this->security->getUser();
        $filters = [
            'q' => $this->normalizeString($request->query->get('q')),
            'attackerCharacterId' => $this->normalizeString($request->query->get('attackerCharacterId')),
            'defenderCharacterId' => $this->normalizeString($request->query->get('defenderCharacterId')),
            'moveId' => $this->normalizeString($request->query->get('moveId')),
            'classification' => $this->normalizeString($request->query->get('classification')),
        ];
        $sequences = $this->repository->search($filters, $request->query->getInt('size', 100), $actor instanceof User ? $actor : null);

        return new JsonResponse($this->responseBuilder->buildList($sequences), JsonResponse::HTTP_OK);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $actor = $this->requireAuthenticated();
        $sequence = (new BlockstringSequence())->setAuthor($actor);

        try {
            $this->entityManager->getConnection()->transactional(function () use ($sequence, $request): void {
                $this->mutationService->hydrate($sequence, $this->decodePayload($request));
                $this->entityManager->persist($sequence);
                $this->moderationTransitionService->submitBlockstringForReview($sequence);
                $this->entityManager->flush();
            });
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], JsonResponse::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->responseBuilder->buildDetail($sequence), JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'read', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function read(int $id): JsonResponse
    {
        $actor = $this->security->getUser();
        $sequence = $this->repository->findDetail($id, $actor instanceof User ? $actor : null);
        if (!$sequence instanceof BlockstringSequence) {
            throw new NotFoundHttpException(sprintf('Blockstring %d not found.', $id));
        }

        return new JsonResponse($this->responseBuilder->buildDetail($sequence), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => '\\d+'], methods: ['PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $actor = $this->requireAuthenticated();
        $this->authorizationService->assertCanModerateContent($actor);
        $sequence = $this->repository->find($id);
        if (!$sequence instanceof BlockstringSequence) {
            throw new NotFoundHttpException(sprintf('Blockstring %d not found.', $id));
        }

        try {
            $this->entityManager->getConnection()->transactional(function () use ($sequence, $request): void {
                $this->mutationService->hydrate($sequence, $this->decodePayload($request));
                $this->entityManager->flush();
            });
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], JsonResponse::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->responseBuilder->buildDetail($sequence), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => '\\d+'], methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $actor = $this->requireAuthenticated();
        $this->authorizationService->assertCanModerateContent($actor);
        $sequence = $this->repository->find($id);
        if (!$sequence instanceof BlockstringSequence) {
            throw new NotFoundHttpException(sprintf('Blockstring %d not found.', $id));
        }

        $this->entityManager->remove($sequence);
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
}
