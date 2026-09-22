<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\CharacterObject;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\Season;
use App\Entity\User;
use App\Entity\Visibility;
use App\Service\ComboSequenceCreationService;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class MoveResourceEffectControllerTest extends DatabaseTestCase
{
    public function testModeratorSetsEffectsAndComboLedgerReflectsThem(): void
    {
        [$move, $leaf, $medals, $connection] = $this->seedCharacterWithResource('Manon', 'Medals');
        $headers = $this->loginHeaders($this->createUser('moderator_user', UserRole::MODERATOR)->getUsername());

        $this->client->request('PATCH', sprintf('/api/moderation/frame-data/resource-effects/%s', $move->getId()?->toRfc4122()), [], [], $headers, json_encode([
            'effects' => [['resourceId' => $medals->getId(), 'mode' => 'relative', 'amount' => 1]],
        ]));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame([['resourceId' => $medals->getId(), 'resourceName' => 'Medals', 'mode' => 'relative', 'amount' => 1, 'source' => 'manual', 'observationCount' => 0]], $payload['resourceEffects']);

        $combo = static::getContainer()->get(ComboSequenceCreationService::class)->createFromPayload(['name' => 'Medal combo', 'description' => 'x'], 'combo', [
            ['child_sequence_id' => $leaf->getId(), 'ordinal_in_combo' => 1, 'connection_type_id' => $connection->getId()],
            ['child_sequence_id' => $leaf->getId(), 'ordinal_in_combo' => 2, 'connection_type_id' => $connection->getId()],
        ]);

        $this->client->request('GET', sprintf('/api/combo-sequences/%d/resource-ledger', $combo->getId()), [], [], $headers);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $ledger = json_decode((string) $this->client->getResponse()->getContent(), true)['ledger'];
        self::assertSame('manon_medals', $ledger[0]['resource']['object_key']);
        self::assertSame([1, 2, 3, 2], [$ledger[0]['start'], $ledger[0]['gained'], $ledger[0]['end'], count($ledger[0]['steps'])]);

        $this->client->request('POST', '/api/combo-sequences/resource-ledger', [], [], $headers, json_encode(['leafSequenceIds' => [$leaf->getId()], 'starts' => ['manon_medals' => 4]]));
        $preview = json_decode((string) $this->client->getResponse()->getContent(), true)['ledger'];
        self::assertSame([4, 5], [$preview[0]['start'], $preview[0]['end']]);

        $this->client->request('GET', sprintf('/api/moderation/frame-data/characters/%s/moves', $move->getCharacter()->getId()?->toRfc4122()), [], [], $headers);
        $moves = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame('Medals', $moves['resources'][0]['name']);
        self::assertSame(1, $moves['moves'][0]['resourceEffects'][0]['amount']);
    }

    public function testResourceOfAnotherCharacterIsRejectedAndUsersAreForbidden(): void
    {
        [$move] = $this->seedCharacterWithResource('Manon', 'Medals');
        [, , $foreign] = $this->seedCharacterWithResource('Jamie', 'Drinks');
        $headers = $this->loginHeaders($this->createUser('moderator_user', UserRole::MODERATOR)->getUsername());
        $uri = sprintf('/api/moderation/frame-data/resource-effects/%s', $move->getId()?->toRfc4122());

        $this->client->request('PATCH', $uri, [], [], $headers, json_encode(['effects' => [['resourceId' => $foreign->getId(), 'mode' => 'relative', 'amount' => 1]]]));
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());

        $userHeaders = $this->loginHeaders($this->createUser('normal_user', UserRole::USER)->getUsername());
        $this->client->request('PATCH', $uri, [], [], $userHeaders, json_encode(['effects' => []]));
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    /** @return array{0: Move, 1: ComboSequences, 2: CharacterObject, 3: ConnectionType} */
    private function seedCharacterWithResource(string $characterName, string $resourceName): array
    {
        $repository = $this->entityManager->getRepository(ComboSequenceType::class);
        $comboType = $repository->findOneBy(['name' => 'combo']) ?? (new ComboSequenceType())->setName('combo');
        $leafType = $repository->findOneBy(['name' => 'leaf']) ?? (new ComboSequenceType())->setName('leaf');
        $visibility = $this->entityManager->getRepository(Visibility::class)->findOneBy(['name' => 'public']) ?? (new Visibility())->setName('public');
        $connection = $this->entityManager->getRepository(ConnectionType::class)->findOneBy(['name' => 'Initial Move']) ?? (new ConnectionType())->setName('Initial Move');
        $season = $this->entityManager->getRepository(Season::class)->findOneBy(['name' => 'S1']) ?? (new Season())->setName('S1')->setStartDate(new \DateTimeImmutable('2025-01-01'));
        $character = (new Character())->setName($characterName);
        $frameData = (new FrameData())->setMoveType('special');
        $move = (new Move())->setCharacter($character)->setNumpadNotation('236K')->setFrameData($frameData);
        $leaf = (new ComboSequences())->setName($characterName . ' 236K')->setDescription('leaf')->setMove($move)->setType($leafType)->setVisibility($visibility);
        $resource = (new CharacterObject())->setCharacter($character)->setObjectKey(strtolower($characterName) . '_' . strtolower($resourceName))->setName($resourceName)->setKind('scaler')->setStatusType('integer')->setMaxStatus(5)->setStartsWith(1)->setCanBeAddedRelative(true);
        foreach ([$comboType, $leafType, $visibility, $connection, $season, $character, $frameData, $move, $leaf, $resource] as $entity) {
            $this->entityManager->persist($entity);
        }
        $this->entityManager->flush();

        return [$move, $leaf, $resource, $connection];
    }

    private function createUser(string $username, UserRole $role): User
    {
        $user = (new User())->setUsername($username)->setPassword(self::hashTestPassword())->setRoles([$role->value])->setIsActive(true);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    /** @return array<string, string> */
    private function loginHeaders(string $username): array
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['username' => $username, 'password' => 'testpassword']));
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        return ['HTTP_X_CSRF_TOKEN' => (string) ($payload['csrfToken'] ?? ''), 'CONTENT_TYPE' => 'application/json'];
    }
}
