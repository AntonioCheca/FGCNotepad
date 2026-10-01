<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\User;
use App\Service\ComboSequenceCreationService;
use App\Tests\ComboDamageAuditFixtures;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

final class AdminComboDamageAuditControllerTest extends DatabaseTestCase
{
    public function testAdminGetsTheDamageReportOfTheRequestedCombos(): void
    {
        $fixtures = new ComboDamageAuditFixtures($this->entityManager, static::getContainer()->get(ComboSequenceCreationService::class));
        $matching = $fixtures->createCombo(['5MP', '236HP'], 1800);
        $mismatching = $fixtures->createCombo(['236HP', '5MP'], 1000);

        $payload = $this->audit(['comboIds' => [$matching, $mismatching]], [UserRole::ADMIN], Response::HTTP_OK);

        self::assertSame(2, $payload['checkedCount']);
        self::assertSame(1, $payload['matchCount']);
        self::assertSame(1, $payload['mismatchCount']);
        self::assertSame(['match', 'mismatch'], array_column($payload['results'], 'status'));
        self::assertSame(800, $payload['results'][1]['difference']);
    }

    public function testNonAdminsAreForbidden(): void
    {
        $this->audit(['comboIds' => [1]], [UserRole::USER], Response::HTTP_FORBIDDEN);
    }

    public function testAnonymousRequestsAreUnauthorized(): void
    {
        $this->client->request('POST', '/api/admin/combo-damage-audits', [], [], ['CONTENT_TYPE' => 'application/json'], '{"comboIds":[1]}');

        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    /**
     * @dataProvider invalidPayloads
     *
     * @param array<string, mixed> $body
     */
    public function testInvalidComboIdsAreRejected(array $body): void
    {
        $payload = $this->audit($body, [UserRole::ADMIN], Response::HTTP_BAD_REQUEST);

        self::assertArrayHasKey('error', $payload);
    }

    /** @return iterable<string, array{array<string, mixed>}> */
    public static function invalidPayloads(): iterable
    {
        yield 'missing' => [[]];
        yield 'empty' => [['comboIds' => []]];
        yield 'not a list' => [['comboIds' => ['a' => 1]]];
        yield 'not integers' => [['comboIds' => ['12']]];
        yield 'not positive' => [['comboIds' => [0]]];
    }

    /**
     * @param array<string, mixed> $body
     * @param list<UserRole> $roles
     *
     * @return array<string, mixed>
     */
    private function audit(array $body, array $roles, int $expectedStatus): array
    {
        $user = (new User())
            ->setUsername(sprintf('user_%s', bin2hex(random_bytes(4))))
            ->setPassword(self::hashTestPassword())
            ->setRoles(array_map(static fn (UserRole $role): string => $role->value, $roles))
            ->setIsActive(true);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['username' => $user->getUsername(), 'password' => 'testpassword'], JSON_THROW_ON_ERROR));
        $login = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $this->client->request('POST', '/api/admin/combo-damage-audits', [], [], ['HTTP_X_CSRF_TOKEN' => (string) $login['csrfToken'], 'CONTENT_TYPE' => 'application/json'], json_encode($body, JSON_THROW_ON_ERROR));
        self::assertSame($expectedStatus, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        return is_array($payload) ? $payload : [];
    }
}
