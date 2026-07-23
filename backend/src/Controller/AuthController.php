<?php declare(strict_types=1);

namespace App\Controller;

use App\Service\RegistrationService;
use App\Service\RegistrationInviteCodeService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class AuthController extends AbstractController
{
    private RegistrationService $registrationService;

    public function __construct(
        RegistrationService $registrationService,
        private readonly RegistrationInviteCodeService $inviteCodeService,
        #[Autowire('%kernel.environment%')]
        private readonly string $environment,
        #[Autowire('%env(default:app.registration_enabled.default:bool:REGISTRATION_ENABLED)%')]
        private readonly bool $registrationEnabled,
    ) {
        $this->registrationService = $registrationService;
    }

    #[Route('/register', name: 'api_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || !isset($data['username'], $data['password']) || !is_string($data['username']) || !is_string($data['password'])) {
            return new JsonResponse(['message' => 'Username and password are required.'], Response::HTTP_BAD_REQUEST);
        }

        $inviteCode = null;
        if ('prod' === $this->environment && !$this->registrationEnabled) {
            $submittedInviteCode = $data['inviteCode'] ?? null;
            $inviteCode = is_string($submittedInviteCode) ? $this->inviteCodeService->findUnusedInviteCode($submittedInviteCode) : null;
            if (null === $inviteCode) {
                return new JsonResponse(['message' => 'A valid unused invite code is required.'], Response::HTTP_FORBIDDEN);
            }
        }

        try {
            $user = $this->registrationService->register($data['username'], $data['password'], $inviteCode);
        } catch (ConflictHttpException $exception) {
            return new JsonResponse(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        } catch (\InvalidArgumentException $exception) {
            return new JsonResponse(['message' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return new JsonResponse([
            'message' => 'User registered successfully.',
            'username' => $user->getUsername(),
            'roles' => $user->getRoles(),
        ], Response::HTTP_CREATED);
    }
}
