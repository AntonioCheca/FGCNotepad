<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\Situation;
use App\Entity\User;
use App\Repository\SituationRepository;
use App\Repository\SituationTypeRepository;
use App\Service\EndpointAuthorizationService;
use App\Service\SituationPayloadService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/situations', name: 'api_situations_')]
class SituationController extends AbstractController
{
    public function __construct(
        private readonly SituationRepository $situationRepository,
        private readonly SituationTypeRepository $situationTypeRepository,
        private readonly SituationPayloadService $situationPayloadService,
        private readonly EndpointAuthorizationService $endpointAuthorizationService,
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {
    }

    #[Route('/types', name: 'types', methods: ['GET'])]
    public function types(): JsonResponse
    {
        return new JsonResponse(array_map(
            fn ($type): array => $this->situationPayloadService->normalizeType($type),
            $this->situationTypeRepository->findAllOrdered(),
        ), JsonResponse::HTTP_OK);
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $includeArchived = $this->normalizeBool($request->query->get('includeArchived')) ?? false;
        $typeCode = $this->normalizeString($request->query->get('typeCode'));

        return new JsonResponse(array_map(
            fn (Situation $situation): array => $this->situationPayloadService->normalize($situation),
            $this->situationRepository->findForList($typeCode, $includeArchived),
        ), JsonResponse::HTTP_OK);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $actor = $this->requireModerator();
        $payload = $this->decodePayload($request);
        $situation = new Situation();
        $this->situationPayloadService->applyPayload($situation, $payload, $actor);
        $this->entityManager->persist($situation);
        $this->entityManager->flush();

        return new JsonResponse($this->situationPayloadService->normalize($situation), JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => '\\d+'], methods: ['PATCH'])]
    public function update(Situation $situation, Request $request): JsonResponse
    {
        $this->requireModerator();
        $this->situationPayloadService->applyPayload($situation, $this->decodePayload($request), $situation->getCreatedBy());
        $this->entityManager->flush();

        return new JsonResponse($this->situationPayloadService->normalize($situation), JsonResponse::HTTP_OK);
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => '\\d+'], methods: ['DELETE'])]
    public function delete(Situation $situation): JsonResponse
    {
        $this->requireModerator();
        $situation->setIsArchived(true);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }

    private function requireModerator(): User
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
            $this->endpointAuthorizationService->assertCanModerateContent($actor);
        } catch (UnauthorizedHttpException) {
            throw new UnauthorizedHttpException('', 'Unauthorized');
        } catch (AccessDeniedHttpException) {
            throw new AccessDeniedHttpException('Forbidden');
        }

        return $actor;
    }

    /** @return array<string,mixed> */
    private function decodePayload(Request $request): array
    {
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        return $payload;
    }

    private function normalizeString(mixed $value): ?string
    {
        return is_string($value) && '' !== trim($value) ? trim($value) : null;
    }

    private function normalizeBool(mixed $value): ?bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if (!is_string($value)) {
            return null;
        }

        return in_array(strtolower(trim($value)), ['1', 'true'], true) ? true : (in_array(strtolower(trim($value)), ['0', 'false'], true) ? false : null);
    }
}
