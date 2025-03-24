<?php declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Util\MixedValidator;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class AuthController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private UserPasswordHasherInterface $passwordHasher;

    private JWTTokenManagerInterface $jwtManager;
    private UserRepository $userRepository;

    public function __construct(EntityManagerInterface $entityManager, UserPasswordHasherInterface $passwordHasher, JWTTokenManagerInterface $jwtManager, UserRepository $userRepository)
    {
        $this->entityManager = $entityManager;
        $this->passwordHasher = $passwordHasher;
        $this->jwtManager = $jwtManager;
        $this->userRepository = $userRepository;
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
        $data = json_decode($request->getContent(), true);

        // Validate input data
        if (!isset($data['username'], $data['password'])) {
            return new JsonResponse(['message' => 'Email and password are required.'], Response::HTTP_BAD_REQUEST);
        }

        $username = $data['username'];
        $password = $data['password'];

        // Check if user already exists
        $existingUser = $this->entityManager->getRepository(User::class)->findOneBy(['username' => $username]);
        if ($existingUser) {
            return new JsonResponse(['message' => 'User already exists.'], Response::HTTP_CONFLICT);
        }

        // Create new user
        $user = new User();
        $user->setUsername($username);
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));
        $user->setRoles(['ROLE_USER']); // Default role

        // Persist user to database
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return new JsonResponse(['message' => 'User registered successfully.'], Response::HTTP_CREATED);
    }
}
