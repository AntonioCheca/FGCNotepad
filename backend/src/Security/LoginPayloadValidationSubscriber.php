<?php declare(strict_types=1);

namespace App\Security;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class LoginPayloadValidationSubscriber implements EventSubscriberInterface
{
    private const LOGIN_PATHS = [
        '/api/login' => true,
        '/api/login_check' => true,
    ];

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::REQUEST => ['validateLoginPayload', 16]];
    }

    public function validateLoginPayload(RequestEvent $event): void
    {
        $request = $event->getRequest();
        if (Request::METHOD_POST !== $request->getMethod() || !isset(self::LOGIN_PATHS[$request->getPathInfo()])) {
            return;
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return;
        }

        if ((array_key_exists('username', $payload) && !is_string($payload['username'])) || (array_key_exists('password', $payload) && !is_string($payload['password']))) {
            $event->setResponse(new JsonResponse(['message' => 'Username and password must be strings.'], JsonResponse::HTTP_BAD_REQUEST));
        }
    }
}
