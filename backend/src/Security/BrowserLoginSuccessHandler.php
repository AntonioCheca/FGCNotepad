<?php declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use App\Service\AuthenticatedUserPayloadFactory;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;

class BrowserLoginSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    public const CSRF_TOKEN_ID = 'api_session';

    public function __construct(
        private readonly AuthenticatedUserPayloadFactory $userPayloadFactory,
        private readonly CsrfTokenManagerInterface $csrfTokenManager,
    ) {
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token): ?Response
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['message' => 'Authentication failed.'], Response::HTTP_UNAUTHORIZED);
        }

        if ($request->hasSession()) {
            $request->getSession()->migrate(true);
        }

        return new JsonResponse([
            'user' => $this->userPayloadFactory->create($user),
            'csrfToken' => $this->csrfTokenManager->getToken(self::CSRF_TOKEN_ID)->getValue(),
        ], Response::HTTP_OK);
    }
}
