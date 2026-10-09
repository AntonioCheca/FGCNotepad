<?php declare(strict_types=1);

namespace App\Security;

use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;

/**
 * Caps anonymous API reads per IP so crawlers cannot hammer search and detail endpoints.
 * Signed-in users are never limited here.
 */
class AnonymousApiReadRateLimitSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly Security $security,
        #[Autowire(service: 'limiter.anonymous_api_read')]
        private readonly RateLimiterFactoryInterface $anonymousApiReadLimiter,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        // Runs after the firewall (priority 8) so the session user is known.
        return [KernelEvents::REQUEST => ['limitAnonymousReads', 4]];
    }

    public function limitAnonymousReads(RequestEvent $event): void
    {
        $request = $event->getRequest();
        if (!$event->isMainRequest() || !$request->isMethodSafe() || !str_starts_with($request->getPathInfo(), '/api/') || null !== $this->security->getUser()) {
            return;
        }

        $limit = $this->anonymousApiReadLimiter->create($request->getClientIp() ?? 'unknown')->consume();
        if ($limit->isAccepted()) {
            return;
        }

        $response = new JsonResponse(['message' => 'Too many requests. Try again in a minute.'], JsonResponse::HTTP_TOO_MANY_REQUESTS);
        $response->headers->set('Retry-After', (string) max(1, $limit->getRetryAfter()->getTimestamp() - time()));
        $event->setResponse($response);
    }
}
