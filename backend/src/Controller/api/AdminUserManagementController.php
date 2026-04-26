<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\AdminUserManagementService;
use App\Service\EndpointAuthorizationService;
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

#[Route('/api/admin/users', name: 'api_admin_users_')]
class AdminUserManagementController extends AbstractController
{
    public function __construct(
        private readonly EndpointAuthorizationService $endpointAuthorizationService,
        private readonly UserRepository $userRepository,
        private readonly AdminUserManagementService $adminUserManagementService,
        private readonly Security $security,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $this->requireAdminActor();
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        $page = max(1, $request->query->getInt('page', 1));
        $size = max(1, min(100, $request->query->getInt('size', 20)));

        $users = $this->userRepository->findPaginated($page, $size);
        $total = $this->userRepository->countAllUsers();

        return new JsonResponse([
            'page' => $page,
            'size' => $size,
            'total' => $total,
            'data' => array_map(fn (User $user): array => $this->normalizeUserRow($user), $users),
        ], Response::HTTP_OK);
    }

    #[Route('/{id}/roles', name: 'update_roles', methods: ['PATCH'])]
    public function updateRoles(string $id, Request $request): JsonResponse
    {
        try {
            $this->requireAdminActor();
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        try {
            $target = $this->findUserById($id);
            $payload = json_decode((string) $request->getContent(), true);
            if (!is_array($payload) || !isset($payload['roles']) || !is_array($payload['roles'])) {
                throw new BadRequestHttpException('roles array is required.');
            }

            $roles = $this->adminUserManagementService->updateUserRoles($target, $payload['roles']);
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (ConflictHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_CONFLICT);
        }

        return new JsonResponse([
            'id' => $target->getId()?->toRfc4122(),
            'username' => $target->getUsername(),
            'roles' => $roles,
            'isActive' => $target->isActive(),
            'deactivatedAt' => $target->getDeactivatedAt()?->format(DATE_ATOM),
        ], Response::HTTP_OK);
    }

    #[Route('/{id}/deactivate', name: 'deactivate', methods: ['POST'])]
    public function deactivate(string $id): JsonResponse
    {
        try {
            $this->requireAdminActor();
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        try {
            $target = $this->findUserById($id);
            $this->adminUserManagementService->deactivateUser($target);
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        } catch (ConflictHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_CONFLICT);
        }

        return new JsonResponse([
            'id' => $target->getId()?->toRfc4122(),
            'username' => $target->getUsername(),
            'roles' => $target->getRoles(),
            'isActive' => $target->isActive(),
            'deactivatedAt' => $target->getDeactivatedAt()?->format(DATE_ATOM),
        ], Response::HTTP_OK);
    }

    private function requireAdminActor(): User
    {
        $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        $this->endpointAuthorizationService->assertCanManageUsers($actor);

        return $actor;
    }

    private function findUserById(string $id): User
    {
        if (!Uuid::isValid($id)) {
            throw new NotFoundHttpException('User not found.');
        }

        $target = $this->userRepository->find($id);
        if (!$target instanceof User) {
            throw new NotFoundHttpException('User not found.');
        }

        return $target;
    }

    /**
     * @return array<string,mixed>
     */
    private function normalizeUserRow(User $user): array
    {
        return [
            'id' => $user->getId()?->toRfc4122(),
            'username' => $user->getUsername(),
            'roles' => $user->getRoles(),
            'isActive' => $user->isActive(),
            'deactivatedAt' => $user->getDeactivatedAt()?->format(DATE_ATOM),
        ];
    }
}
