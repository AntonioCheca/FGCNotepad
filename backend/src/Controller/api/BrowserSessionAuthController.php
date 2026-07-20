<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\User;
use App\Security\BrowserLoginSuccessHandler;
use App\Service\AuthenticatedUserPayloadFactory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api')]
class BrowserSessionAuthController extends AbstractController
{
    public function __construct(
        private readonly AuthenticatedUserPayloadFactory $userPayloadFactory,
        private readonly CsrfTokenManagerInterface $csrfTokenManager,
        private readonly TokenStorageInterface $tokenStorage,
    ) {
    }

    #[Route('/me', name: 'api_browser_me', methods: ['GET'])]
    public function me(#[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return new JsonResponse(['message' => 'Authentication required.'], Response::HTTP_UNAUTHORIZED);
        }

        return new JsonResponse([
            'authenticated' => true,
            'user' => $this->userPayloadFactory->create($user),
            'csrfToken' => $this->csrfTokenManager->getToken(BrowserLoginSuccessHandler::CSRF_TOKEN_ID)->getValue(),
        ], Response::HTTP_OK);
    }

    #[Route('/csrf-token', name: 'api_browser_csrf_token', methods: ['GET'])]
    public function csrfToken(#[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return new JsonResponse(['message' => 'Authentication required.'], Response::HTTP_UNAUTHORIZED);
        }

        return new JsonResponse([
            'csrfToken' => $this->csrfTokenManager->getToken(BrowserLoginSuccessHandler::CSRF_TOKEN_ID)->getValue(),
        ], Response::HTTP_OK);
    }

    #[Route('/logout', name: 'api_browser_logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        $this->tokenStorage->setToken(null);

        if ($request->hasSession()) {
            $request->getSession()->invalidate();
        }

        return new JsonResponse(['message' => 'Logged out.'], Response::HTTP_OK);
    }
}
