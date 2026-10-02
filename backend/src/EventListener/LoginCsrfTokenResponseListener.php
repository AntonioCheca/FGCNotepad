<?php declare(strict_types=1);

namespace App\EventListener;

use App\Security\BrowserLoginSuccessHandler;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Http\Event\LoginSuccessEvent;

/**
 * Symfony's session strategy may clear CSRF tokens after the success handler has run
 * (e.g. re-login after a role change), so the token must be issued after that listener.
 */
#[AsEventListener(event: LoginSuccessEvent::class, priority: -64)]
class LoginCsrfTokenResponseListener
{
    public function __construct(
        private readonly CsrfTokenManagerInterface $csrfTokenManager,
    ) {
    }

    public function __invoke(LoginSuccessEvent $event): void
    {
        $response = $event->getResponse();
        if (!$response instanceof JsonResponse || 'api' !== $event->getFirewallName()) {
            return;
        }

        $payload = json_decode((string) $response->getContent(), true);
        if (!is_array($payload)) {
            return;
        }

        $payload['csrfToken'] = $this->csrfTokenManager->getToken(BrowserLoginSuccessHandler::CSRF_TOKEN_ID)->getValue();
        $response->setData($payload);
    }
}
