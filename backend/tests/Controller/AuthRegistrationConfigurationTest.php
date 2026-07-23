<?php declare(strict_types=1);

namespace App\Tests\Controller;

use App\Controller\AuthController;
use App\Entity\RegistrationInviteCode;
use App\Entity\User;
use App\Service\RegistrationInviteCodeService;
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
            $this->createMock(RegistrationInviteCodeService::class),
            'prod',
            false,
        );

        $response = $controller->register(new Request(content: json_encode([
            'username' => 'blocked_user',
            'password' => 'testpassword',
        ])));

        self::assertSame(Response::HTTP_FORBIDDEN, $response->getStatusCode());
        self::assertSame(['message' => 'A valid unused invite code is required.'], json_decode((string) $response->getContent(), true));
    }

    public function testProductionRegistrationAcceptsValidInviteCodeWhenGlobalRegistrationDisabled(): void
    {
        $inviteCode = new RegistrationInviteCode();
        $user = new User();
        $user->setUsername('invited_user');
        $user->setPassword('hashed-password');
        $user->setRoles(['ROLE_USER']);

        $registrationService = $this->createMock(RegistrationService::class);
        $registrationService
            ->expects($this->once())
            ->method('register')
            ->with('invited_user', 'testpassword', $this->identicalTo($inviteCode))
            ->willReturn($user);

        $inviteCodeService = $this->createMock(RegistrationInviteCodeService::class);
        $inviteCodeService
            ->expects($this->once())
            ->method('findUnusedInviteCode')
            ->with('fgt-alpha-valid')
            ->willReturn($inviteCode);

        $controller = new AuthController(
            $registrationService,
            $inviteCodeService,
            'prod',
            false,
        );

        $response = $controller->register(new Request(content: json_encode([
            'username' => 'invited_user',
            'password' => 'testpassword',
            'inviteCode' => 'fgt-alpha-valid',
        ])));

        self::assertSame(Response::HTTP_CREATED, $response->getStatusCode());
        self::assertSame('User registered successfully.', json_decode((string) $response->getContent(), true)['message'] ?? null);
    }
}
