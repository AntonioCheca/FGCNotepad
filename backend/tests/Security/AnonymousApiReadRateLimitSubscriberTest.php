<?php declare(strict_types=1);

namespace App\Tests\Security;

use App\Entity\User;
use App\Security\AnonymousApiReadRateLimitSubscriber;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\RateLimiter\Storage\InMemoryStorage;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;

final class AnonymousApiReadRateLimitSubscriberTest extends KernelTestCase
{
    private const LIMIT = 3;

    private AnonymousApiReadRateLimitSubscriber $subscriber;

    protected function setUp(): void
    {
        self::bootKernel();
        $limiter = new RateLimiterFactory(['id' => 'anonymous_api_read_test', 'policy' => 'fixed_window', 'limit' => self::LIMIT, 'interval' => '1 minute'], new InMemoryStorage());
        $this->subscriber = new AnonymousApiReadRateLimitSubscriber(self::getContainer()->get(Security::class), $limiter);
    }

    public function testAnonymousReadsAreLimitedPerIp(): void
    {
        for ($request = 0; $request < self::LIMIT; ++$request) {
            self::assertNull($this->dispatch('GET', '/api/characters', '203.0.113.1'));
        }

        $blocked = $this->dispatch('GET', '/api/combo-sequences', '203.0.113.1');
        self::assertSame(Response::HTTP_TOO_MANY_REQUESTS, $blocked?->getStatusCode());
        self::assertTrue($blocked->headers->has('Retry-After'));

        self::assertNull($this->dispatch('GET', '/api/characters', '203.0.113.2'), 'other IPs keep their own budget');
    }

    public function testWritesNonApiPathsAndSignedInUsersAreNotCounted(): void
    {
        for ($request = 0; $request < self::LIMIT + 2; ++$request) {
            self::assertNull($this->dispatch('POST', '/api/login', '203.0.113.3'));
            self::assertNull($this->dispatch('GET', '/combos', '203.0.113.3'));
        }

        $user = (new User())->setUsername('limited_member')->setPassword('unused')->setRoles([]);
        self::getContainer()->get(TokenStorageInterface::class)->setToken(new UsernamePasswordToken($user, 'api', $user->getRoles()));
        for ($request = 0; $request < self::LIMIT + 2; ++$request) {
            self::assertNull($this->dispatch('GET', '/api/characters', '203.0.113.3'));
        }
    }

    private function dispatch(string $method, string $path, string $clientIp): ?Response
    {
        $request = Request::create($path, $method, server: ['REMOTE_ADDR' => $clientIp]);
        $event = new RequestEvent(self::$kernel, $request, HttpKernelInterface::MAIN_REQUEST);
        $this->subscriber->limitAnonymousReads($event);

        return $event->getResponse();
    }
}
