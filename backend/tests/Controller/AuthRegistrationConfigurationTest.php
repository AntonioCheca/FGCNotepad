<?php declare(strict_types=1);

namespace App\Tests\Controller;

use App\Controller\AuthController;
use App\Service\RegistrationService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class AuthRegistrationConfigurationTest extends TestCase
{
    public function testProductionRegistrationIsBlockedByDefault(): void
    {
        $controller = new AuthController(
            $this->createMock(RegistrationService::class),
            'prod',
            false,
        );

        $response = $controller->register(new Request(content: json_encode([
            'username' => 'blocked_user',
            'password' => 'testpassword',
        ])));

        self::assertSame(Response::HTTP_FORBIDDEN, $response->getStatusCode());
        self::assertSame(['message' => 'Registration is disabled.'], json_decode((string) $response->getContent(), true));
    }
}
