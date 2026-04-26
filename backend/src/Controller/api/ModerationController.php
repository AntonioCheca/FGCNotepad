<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ComboSequences;
use App\Entity\Post;
use App\Entity\Scenario;
use App\Entity\User;
use App\Repository\ComboSequencesRepository;
use App\Repository\PostRepository;
use App\Repository\ScenarioRepository;
use App\Service\EndpointAuthorizationService;
use App\Service\ModerationQueueService;
use App\Service\ModerationTransitionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/api/moderation', name: 'api_moderation_')]
class ModerationController extends AbstractController
{
    public function __construct(
        private readonly EndpointAuthorizationService $endpointAuthorizationService,
        private readonly ModerationQueueService $moderationQueueService,
        private readonly ModerationTransitionService $moderationTransitionService,
        private readonly PostRepository $postRepository,
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly ScenarioRepository $scenarioRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {
    }

    #[Route('/queue', name: 'queue', methods: ['GET'])]
    public function queue(Request $request): JsonResponse
    {
        try {
            $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
            $this->endpointAuthorizationService->assertCanModerateContent($actor);
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        try {
            $payload = $this->moderationQueueService->getQueue(
                $this->parseListFilter($request->query->all()['contentType'] ?? null),
                $this->parseListFilter($request->query->all()['state'] ?? null),
                (string) $request->query->get('sort', 'oldest')
            );
        } catch (\InvalidArgumentException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($payload, Response::HTTP_OK);
    }

    #[Route('/{type}/{id}/approve', name: 'approve', methods: ['POST'])]
    public function approve(string $type, string $id): JsonResponse
    {
        try {
            $actor = $this->requireModeratorActor();
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        try {
            $target = $this->resolveTarget($type, $id);
            if ($target instanceof Post) {
                $this->moderationTransitionService->approvePost($target, $actor);
            } elseif ($target instanceof ComboSequences) {
                $this->moderationTransitionService->approveCombo($target, $actor);
            } else {
                $this->moderationTransitionService->approveScenario($target, $actor);
            }
            $this->entityManager->flush();
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        } catch (ConflictHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_CONFLICT);
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->buildDecisionResponse($type, $target), Response::HTTP_OK);
    }

    #[Route('/{type}/{id}/reject', name: 'reject', methods: ['POST'])]
    public function reject(string $type, string $id, Request $request): JsonResponse
    {
        try {
            $actor = $this->requireModeratorActor();
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        $reason = $this->extractReason($request);

        try {
            $target = $this->resolveTarget($type, $id);
            if ($target instanceof Post) {
                $this->moderationTransitionService->rejectPost($target, $actor, $reason);
            } elseif ($target instanceof ComboSequences) {
                $this->moderationTransitionService->rejectCombo($target, $actor, $reason);
            } else {
                $this->moderationTransitionService->rejectScenario($target, $actor, $reason);
            }
            $this->entityManager->flush();
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        } catch (ConflictHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_CONFLICT);
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->buildDecisionResponse($type, $target), Response::HTTP_OK);
    }

    #[Route('/{type}/{id}/hide', name: 'hide', methods: ['POST'])]
    public function hide(string $type, string $id, Request $request): JsonResponse
    {
        try {
            $actor = $this->requireModeratorActor();
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        $reason = $this->extractReason($request);

        try {
            $target = $this->resolveTarget($type, $id);
            if ($target instanceof Post) {
                $this->moderationTransitionService->hidePost($target, $actor, $reason);
            } elseif ($target instanceof ComboSequences) {
                $this->moderationTransitionService->hideCombo($target, $actor, $reason);
            } else {
                $this->moderationTransitionService->hideScenario($target, $actor, $reason);
            }
            $this->entityManager->flush();
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        } catch (ConflictHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_CONFLICT);
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return new JsonResponse($this->buildDecisionResponse($type, $target), Response::HTTP_OK);
    }

    /**
     * @return list<string>
     */
    private function parseListFilter(mixed $rawFilter): array
    {
        if (null === $rawFilter) {
            return [];
        }

        if (is_string($rawFilter)) {
            $parts = explode(',', $rawFilter);

            return array_values(array_filter(array_map(
                static fn (string $part): string => trim($part),
                $parts
            ), static fn (string $part): bool => '' !== $part));
        }

        if (is_array($rawFilter)) {
            $normalized = [];
            foreach ($rawFilter as $value) {
                if (!is_string($value)) {
                    continue;
                }
                $parts = explode(',', $value);
                foreach ($parts as $part) {
                    $trimmed = trim($part);
                    if ('' !== $trimmed) {
                        $normalized[] = $trimmed;
                    }
                }
            }

            return array_values($normalized);
        }

        return [];
    }

    private function requireModeratorActor(): User
    {
        $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        $this->endpointAuthorizationService->assertCanModerateContent($actor);

        return $actor;
    }

    private function extractReason(Request $request): string
    {
        $payload = json_decode((string) $request->getContent(), true);
        if (!is_array($payload) || !array_key_exists('reason', $payload) || !is_string($payload['reason'])) {
            throw new BadRequestHttpException('reason is required.');
        }

        $reason = trim($payload['reason']);
        if ('' === $reason) {
            throw new BadRequestHttpException('reason is required.');
        }

        return $reason;
    }

    private function resolveTarget(string $type, string $id): Post|ComboSequences|Scenario
    {
        $normalizedType = trim(mb_strtolower($type));

        if ('post' === $normalizedType) {
            if (!Uuid::isValid($id)) {
                throw new NotFoundHttpException('Post not found.');
            }

            $post = $this->postRepository->find($id);
            if (!$post instanceof Post) {
                throw new NotFoundHttpException('Post not found.');
            }

            return $post;
        }

        if ('combo' === $normalizedType) {
            if (!ctype_digit($id)) {
                throw new NotFoundHttpException('Combo not found.');
            }

            $combo = $this->comboSequencesRepository->find((int) $id);
            if (!$combo instanceof ComboSequences) {
                throw new NotFoundHttpException('Combo not found.');
            }

            return $combo;
        }

        if ('scenario' === $normalizedType) {
            if (!Uuid::isValid($id)) {
                throw new NotFoundHttpException('Scenario not found.');
            }

            $scenario = $this->scenarioRepository->findOneByPublicId($id);
            if (!$scenario instanceof Scenario) {
                throw new NotFoundHttpException('Scenario not found.');
            }

            return $scenario;
        }

        throw new NotFoundHttpException('Unsupported moderation type.');
    }

    /**
     * @return array<string,mixed>
     */
    private function buildDecisionResponse(string $type, Post|ComboSequences|Scenario $target): array
    {
        $contentType = trim(mb_strtolower($type));
        $contentId = $target instanceof Post
            ? (string) $target->getId()?->toRfc4122()
            : ($target instanceof ComboSequences
                ? (string) $target->getId()
                : $target->getPublicId()->toRfc4122());

        $decidedBy = $target->getModerationDecidedBy();

        return [
            'contentType' => $contentType,
            'contentId' => $contentId,
            'moderationState' => $target->getModerationState(),
            'isPubliclyVisible' => 'approved' === $target->getModerationState(),
            'moderationDecidedAt' => $target->getModerationDecidedAt()?->format(DATE_ATOM),
            'moderationDecidedBy' => $decidedBy?->getUsername(),
            'moderationReason' => $target->getModerationReason(),
        ];
    }
}
