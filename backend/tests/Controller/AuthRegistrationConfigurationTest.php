<?php declare(strict_types=1);

namespace App\Tests\Controller;

use App\Controller\AuthController;
use App\Repository\UserRepository;
use App\Service\RegistrationService;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AuthRegistrationConfigurationTest extends TestCase
{
    public function testProductionRegistrationIsBlockedByDefault(): void
    {
        $controller = new AuthController(
            $this->createMock(UserPasswordHasherInterface::class),
            $this->createMock(JWTTokenManagerInterface::class),
            $this->createMock(UserRepository::class),
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
