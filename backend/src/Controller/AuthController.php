<?php declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\RegistrationService;
use App\Util\MixedValidator;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class AuthController extends AbstractController
{
    private UserPasswordHasherInterface $passwordHasher;

    private JWTTokenManagerInterface $jwtManager;
    private UserRepository $userRepository;
    private RegistrationService $registrationService;

    public function __construct(
        UserPasswordHasherInterface $passwordHasher,
        JWTTokenManagerInterface $jwtManager,
        UserRepository $userRepository,
        RegistrationService $registrationService,
        #[Autowire('%kernel.environment%')]
        private readonly string $environment,
        #[Autowire('%env(default:app.registration_enabled.default:bool:REGISTRATION_ENABLED)%')]
        private readonly bool $registrationEnabled,
    ) {
        $this->passwordHasher = $passwordHasher;
        $this->jwtManager = $jwtManager;
        $this->userRepository = $userRepository;
        $this->registrationService = $registrationService;
    }

    /**
     * @Route("/login", methods={"POST"})
     */
    public function login(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        MixedValidator::validateMixedValueIsArray($data, "Data to login must be a proper JSON");

        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        MixedValidator::validateMixedValueIsString($username, 'Username must be a string');
        MixedValidator::validateMixedValueIsString($username, 'Password must be a string');
        /**
         * @var User|null $user
         */
        $user = $this->userRepository->findOneBy(['username' => $username]);

        if (!$user || !$this->passwordHasher->isPasswordValid($user, $password)) {
            return new JsonResponse(['error' => 'Invalid credentials'], 401);
        }

        $token = $this->jwtManager->create($user);

        return new JsonResponse(['token' => $token]);
    }

    #[Route('/register', name: 'api_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        if ('prod' === $this->environment && !$this->registrationEnabled) {
            return new JsonResponse(['message' => 'Registration is disabled.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || !isset($data['username'], $data['password']) || !is_string($data['username']) || !is_string($data['password'])) {
            return new JsonResponse(['message' => 'Username and password are required.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $user = $this->registrationService->register($data['username'], $data['password']);
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
