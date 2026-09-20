<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\OkiProfile;
use App\Entity\OkiSetup;
use App\Entity\OkiSetupObservation;
use App\Entity\User;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

final class AdminReplayOkiImportControllerTest extends DatabaseTestCase
{
    public function testImportsAttackerSequenceAndSkipsDuplicatesAndBlockedOkis(): void
    {
        $this->persistCatalog();
        $headers = $this->adminHeaders();

        $payload = $this->post($headers, $this->document([
            $this->oki('o1', true, ['214+MP', '2LK', 'DR']),
            $this->oki('o2', true, ['214+MP', '2LK', 'DR']),
            $this->oki('o3', false, ['214+MP', '2LK'], ['unknown_ender']),
            $this->oki('o4', true, ['214+MP', '9XX']),
        ]));

        self::assertSame(1, $payload['importedCount']);
        self::assertSame(1, $payload['observedCount']);
        self::assertSame('imported', $payload['results'][0]['status']);
        self::assertSame('observed', $payload['results'][1]['status']);
        self::assertSame($payload['results'][0]['setupId'], $payload['results'][1]['setupId']);
        self::assertSame('Export is blocked: unknown_ender.', $payload['results'][2]['reason']);
        self::assertStringContainsString('9XX', $payload['results'][3]['reason']);

        $setup = $this->entityManager->getRepository(OkiSetup::class)->find($payload['results'][0]['setupId']);
        self::assertInstanceOf(OkiSetup::class, $setup);
        self::assertSame('pending_review', $setup->getModerationState());
        self::assertNotNull($setup->getAuthor());
        self::assertTrue($setup->usesDriveRush());
        self::assertTrue($setup->worksBackroll());
        self::assertFalse($setup->worksNoBackroll());
        self::assertCount(1, $setup->getNodes());
        $first = $setup->getNodes()->first();
        self::assertSame('2LK', $first->getMove()->getNumpadNotation());
        self::assertNull($first->getOptionType());
        self::assertCount(1, $this->entityManager->getRepository(OkiProfile::class)->findAll());

        $again = $this->post($headers, $this->document([$this->oki('o5', true, ['214+MP', '2LK', 'DR'])]));
        self::assertSame(0, $again['importedCount']);
    }

    public function testDifferentSequenceAddsSecondSetupToExistingProfile(): void
    {
        $this->persistCatalog();
        $headers = $this->adminHeaders();

        $this->post($headers, $this->document([$this->oki('o1', true, ['214+MP', '2LK'])]));
        $payload = $this->post($headers, $this->document([$this->oki('o2', true, ['214+MP', '5LP'])]));

        self::assertSame(1, $payload['importedCount']);
        $profiles = $this->entityManager->getRepository(OkiProfile::class)->findAll();
        self::assertCount(1, $profiles);
        self::assertCount(2, $profiles[0]->getSetups());
    }

    public function testBundleReportsPerDocumentErrors(): void
    {
        $this->persistCatalog();
        $broken = $this->document([]);
        unset($broken['source']);

        $payload = $this->post($this->adminHeaders(), [
            'format' => 'oki_export_bundle_v1',
            'documents' => [$this->document([$this->oki('o1', true, ['214+MP', '2LK'])]), $broken],
        ]);

        self::assertSame(1, $payload['importedCount']);
        self::assertCount(2, $payload['documents']);
        self::assertSame('source must be an object.', $payload['documents'][1]['error']);
    }

    public function testObservationLinksAttackerAndDefenderReplayPlayers(): void
    {
        $this->persistCatalog();
        $document = $this->document([$this->oki('o1', true, ['214+MP', '2LK'])]);
        $document['replay_context'] = [
            'metadata_available' => true,
            'replay' => ['uploaded_at_unix' => 1789893119, 'battle_version' => 20004000],
            'players' => [
                ['slot' => 1, 'character' => 'Yasmine', 'cfn_name' => 'Defender', 'short_id' => 111, 'rank' => ['metric' => 'LP', 'value' => 14200, 'is_master' => false, 'league_point' => 14200]],
                ['slot' => 2, 'character' => 'Terry', 'cfn_name' => 'Attacker', 'short_id' => 222, 'rank' => ['metric' => 'MR', 'value' => 2060, 'is_master' => true, 'master_rating' => 2060]],
            ],
        ];

        $this->post($this->adminHeaders(), $document);

        $observation = $this->entityManager->getRepository(OkiSetupObservation::class)->findAll()[0];
        self::assertSame(2, $observation->getAttacker()->getSlot());
        self::assertSame(2060, $observation->getAttacker()->getMasterRating());
        self::assertSame(1, $observation->getDefender()->getSlot());
        self::assertSame('LP', $observation->getDefender()->getRankMetric());
        self::assertNull($observation->getDefender()->getMasterRating());
    }

    public function testRejectsUnsupportedFormatAndNonAdmin(): void
    {
        $headers = $this->adminHeaders();
        $document = $this->document([]);
        $document['format'] = 'oki_export_v2';
        $this->client->request('POST', '/api/admin/replay-oki-imports', [], [], $headers, json_encode($document, JSON_THROW_ON_ERROR));
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());

        $user = $this->createUser([UserRole::USER]);
        $this->client->request('POST', '/api/admin/replay-oki-imports', [], [], $this->loginHeaders($user->getUsername(), 'testpassword'), json_encode($this->document([]), JSON_THROW_ON_ERROR));
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    /** @return array<string, string> */
    private function adminHeaders(): array
    {
        $admin = $this->createUser([UserRole::ADMIN]);

        return $this->loginHeaders($admin->getUsername(), 'testpassword');
    }

    /**
     * @param array<string, string> $headers
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    private function post(array $headers, array $body): array
    {
        $this->client->request('POST', '/api/admin/replay-oki-imports', [], [], $headers, json_encode($body, JSON_THROW_ON_ERROR));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        return json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    private function persistCatalog(): void
    {
        $character = (new Character())->setName('Terry');
        $this->entityManager->persist($character);
        foreach (['214+MP', '2LK', '5LP'] as $notation) {
            $this->entityManager->persist((new Move())->setCharacter($character)->setNumpadNotation($notation));
        }
        $this->entityManager->flush();
    }

    /**
     * @param list<array<string, mixed>> $okis
     *
     * @return array<string, mixed>
     */
    private function document(array $okis): array
    {
        return [
            'format' => 'oki_export_v1',
            'source' => ['replay_id' => 'F7SQ9KBSH', 'source_sha256' => str_repeat('a', 64)],
            'okis' => $okis,
        ];
    }

    /**
     * @param list<string> $notations first is the ender; "DR" is a Drive Rush action
     * @param list<string> $blockers
     *
     * @return array<string, mixed>
     */
    private function oki(string $id, bool $ready, array $notations, array $blockers = []): array
    {
        $actions = [];
        foreach ($notations as $index => $notation) {
            $actions[] = 'DR' === $notation
                ? ['action_id' => 5000, 'kind' => 'drive_rush', 'name' => 'Drive Rush', 'notation' => null]
                : ['action_id' => 100 + $index, 'kind' => 'move', 'name' => $notation, 'notation' => $notation];
            $actions[] = ['action_id' => 17, 'kind' => 'engine_state', 'name' => 'DASH_F', 'notation' => null];
        }

        return [
            'id' => $id,
            'attacker' => ['character' => 'Terry', 'player_slot' => 2],
            'defender' => ['character' => 'Yasmine', 'player_slot' => 1],
            'attacker_actions' => $actions,
            'defender_actions' => [],
            'ender' => ['action_id' => 100, 'notation' => '214+MP', 'name' => '214+MP'],
            'recovery' => ['type' => 'backroll'],
            'ready_to_export' => $ready,
            'export_blockers' => $blockers,
        ];
    }

    /** @param list<UserRole> $roles */
    private function createUser(array $roles): User
    {
        $user = (new User())
            ->setUsername(sprintf('user_%s', bin2hex(random_bytes(4))))
            ->setPassword(self::hashTestPassword())
            ->setRoles(array_map(static fn (UserRole $role): string => $role->value, $roles))
            ->setIsActive(true);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    /** @return array<string, string> */
    private function loginHeaders(string $username, string $password): array
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $username,
            'password' => $password,
        ], JSON_THROW_ON_ERROR));
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return [
            'HTTP_X_CSRF_TOKEN' => (string) $payload['csrfToken'],
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
