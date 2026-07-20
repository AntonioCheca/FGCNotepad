<?php declare(strict_types=1);

namespace App\EventListener;

use App\Entity\User;
use App\Security\BrowserLoginSuccessHandler;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

#[AsEventListener(event: KernelEvents::CONTROLLER)]
class BrowserSessionCsrfListener
{
    private const UNSAFE_METHODS = ['POST' => true, 'PUT' => true, 'PATCH' => true, 'DELETE' => true];

    public function __construct(
        private readonly Security $security,
        private readonly CsrfTokenManagerInterface $csrfTokenManager,
    ) {
    }

    public function __invoke(ControllerEvent $event): void
    {
        $request = $event->getRequest();
        if (!$this->shouldValidate($request)) {
            return;
        }

        $submittedToken = $request->headers->get('X-CSRF-Token');
        if (!is_string($submittedToken) || !$this->csrfTokenManager->isTokenValid(new CsrfToken(BrowserLoginSuccessHandler::CSRF_TOKEN_ID, $submittedToken))) {
            $event->setController(static fn (): JsonResponse => new JsonResponse(['message' => 'Invalid CSRF token.'], Response::HTTP_FORBIDDEN));
        }
    }

    private function shouldValidate(Request $request): bool
    {
        if (!str_starts_with($request->getPathInfo(), '/api/')) {
            return false;
        }

        if (!isset(self::UNSAFE_METHODS[$request->getMethod()])) {
            return false;
        }

        if (
            str_starts_with($request->getPathInfo(), '/api/login')
            || str_starts_with($request->getPathInfo(), '/api/register')
            || str_starts_with($request->getPathInfo(), '/api/shared-review/')
        ) {
            return false;
        }

        if (str_starts_with((string) $request->headers->get('Authorization'), 'Bearer ')) {
            return false;
        }

        return $this->security->getUser() instanceof User;
    }
}
