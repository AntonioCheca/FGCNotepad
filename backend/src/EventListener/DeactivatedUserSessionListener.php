<?php declare(strict_types=1);

namespace App\EventListener;

use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

/**
 * Session refresh does not re-run the user checker, so a user deactivated mid-session
 * would otherwise keep their existing login until the session expires.
 */
#[AsEventListener(event: KernelEvents::REQUEST, priority: 7)]
class DeactivatedUserSessionListener
{
    public function __construct(
        private readonly Security $security,
        private readonly TokenStorageInterface $tokenStorage,
    ) {
    }

    public function __invoke(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $user = $this->security->getUser();
        if (!$user instanceof User || $user->isActive()) {
            return;
        }

        $this->tokenStorage->setToken(null);
        $request = $event->getRequest();
        if ($request->hasSession()) {
            $request->getSession()->invalidate();
        }

        $event->setResponse(new JsonResponse(['message' => 'Account deactivated.'], Response::HTTP_UNAUTHORIZED));
    }
}
