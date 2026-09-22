<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\CharacterObject;
use App\Repository\CharacterObjectRepository;
use App\Service\CharacterResourceService;
use App\Service\EndpointAuthorizationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/moderation/resources', name: 'api_moderation_resources_')]
class CharacterResourceModerationController extends AbstractController
{
    public function __construct(
        private readonly EndpointAuthorizationService $endpointAuthorizationService,
        private readonly CharacterObjectRepository $repository,
        private readonly CharacterResourceService $resourceService,
        private readonly Security $security,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        if (null !== ($denied = $this->deny())) {
            return $denied;
        }

        $characterName = trim((string) $request->query->get('characterName', ''));

        return new JsonResponse(['resources' => $this->resourceService->listForApi('' === $characterName ? null : $characterName)], Response::HTTP_OK);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        if (null !== ($denied = $this->deny())) {
            return $denied;
        }

        return $this->saveResource(null, $request, Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => '\d+'], methods: ['PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        if (null !== ($denied = $this->deny())) {
            return $denied;
        }

        $resource = $this->repository->find($id);
        if (!$resource instanceof CharacterObject) {
            return new JsonResponse(['error' => 'Resource not found.'], Response::HTTP_NOT_FOUND);
        }

        return $this->saveResource($resource, $request, Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        if (null !== ($denied = $this->deny())) {
            return $denied;
        }

        $resource = $this->repository->find($id);
        if (!$resource instanceof CharacterObject) {
            return new JsonResponse(['error' => 'Resource not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->resourceService->delete($resource);

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    private function saveResource(?CharacterObject $resource, Request $request, int $status): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return new JsonResponse(['error' => 'Request body must be a JSON object.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $saved = $this->resourceService->save($resource, $payload);
        } catch (\InvalidArgumentException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->resourceService->toApi($saved), $status);
    }

    private function deny(): ?JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
            $this->endpointAuthorizationService->assertCanModerateContent($actor);
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        return null;
    }
}
