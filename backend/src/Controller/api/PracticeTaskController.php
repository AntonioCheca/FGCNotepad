<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\PracticeTask;
use App\Entity\User;
use App\Repository\PracticeTaskRepository;
use App\Service\EndpointAuthorizationService;
use App\Service\ReplayLabResponseBuilder;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/practice-tasks', name: 'api_practice_tasks_')]
final class PracticeTaskController extends AbstractController
{
    public function __construct(
        private readonly PracticeTaskRepository $practiceTaskRepository,
        private readonly ReplayLabResponseBuilder $responseBuilder,
        private readonly EndpointAuthorizationService $authorizationService,
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $actor = $this->requireUser();
        $status = $request->query->get('status', PracticeTask::STATUS_PENDING);
        if (!is_string($status) || !in_array($status, [PracticeTask::STATUS_PENDING, PracticeTask::STATUS_DONE, PracticeTask::STATUS_DISMISSED], true)) {
            throw new BadRequestHttpException('status is invalid.');
        }

        $tasks = $this->practiceTaskRepository->findBy(
            ['user' => $actor, 'status' => $status],
            ['dueDate' => 'ASC', 'createdAt' => 'ASC'],
            100,
        );

        return new JsonResponse(array_map($this->responseBuilder->practiceTask(...), $tasks));
    }

    #[Route('/{id}', name: 'update', methods: ['PATCH'])]
    public function update(PracticeTask $task, Request $request): JsonResponse
    {
        $this->assertOwnsTask($this->requireUser(), $task);
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        if (array_key_exists('title', $payload)) {
            $task->setTitle($this->requireStringValue($payload['title'], 'title'));
        }

        if (array_key_exists('description', $payload)) {
            $task->setDescription($this->requireStringValue($payload['description'], 'description'));
        }

        if (array_key_exists('dueDate', $payload)) {
            $task->setDueDate($this->parseOptionalDate($payload['dueDate']));
        }

        $task->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return new JsonResponse($this->responseBuilder->practiceTask($task));
    }

    #[Route('/{id}/complete', name: 'complete', methods: ['POST'])]
    public function complete(PracticeTask $task): JsonResponse
    {
        $this->assertOwnsTask($this->requireUser(), $task);
        $task
            ->setStatus(PracticeTask::STATUS_DONE)
            ->setCompletedAt(new \DateTimeImmutable())
            ->setCompletedOccurrences($task->getCompletedOccurrences() + 1)
            ->setRemainingOccurrences(max(0, $task->getRemainingOccurrences() - 1))
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return new JsonResponse($this->responseBuilder->practiceTask($task));
    }

    #[Route('/{id}/dismiss', name: 'dismiss', methods: ['POST'])]
    public function dismiss(PracticeTask $task): JsonResponse
    {
        $this->assertOwnsTask($this->requireUser(), $task);
        $task
            ->setStatus(PracticeTask::STATUS_DISMISSED)
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return new JsonResponse($this->responseBuilder->practiceTask($task));
    }

    private function requireUser(): User
    {
        try {
            return $this->authorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            throw new UnauthorizedHttpException('', 'Authentication required.');
        }
    }

    private function assertOwnsTask(User $actor, PracticeTask $task): void
    {
        if ($task->getUser() !== $actor) {
            throw new AccessDeniedHttpException('Practice task not accessible.');
        }
    }

    private function requireStringValue(mixed $value, string $field): string
    {
        if (!is_string($value) || '' === trim($value)) {
            throw new BadRequestHttpException(sprintf('%s must be a non-empty string.', $field));
        }

        return trim($value);
    }

    private function parseOptionalDate(mixed $value): ?\DateTimeImmutable
    {
        if (null === $value || '' === $value) {
            return null;
        }

        if (!is_string($value)) {
            throw new BadRequestHttpException('dueDate must be an ISO date string or null.');
        }

        try {
            return new \DateTimeImmutable($value);
        } catch (\Throwable) {
            throw new BadRequestHttpException('dueDate must be a valid date.');
        }
    }
}
