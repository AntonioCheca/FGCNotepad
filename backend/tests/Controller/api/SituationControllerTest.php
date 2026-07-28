<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\SituationType;
use App\Entity\Step;
use App\Entity\User;
use App\Entity\Visibility;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Component\HttpFoundation\Response;

class SituationControllerTest extends AuthenticatedWebTestCase
{
    /** @var array<string,string> */
    private array $moderatorHeaders = [];

    public function testTypesCanBeListed(): void
    {
        $this->ensureSituationTypes();

        $this->client->request('GET', '/api/situations/types', [], [], $this->getHeaders());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        self::assertContains('blocked_move', array_column($payload, 'code'));
    }

    public function testModeratorCanCreateBlockedMoveSituation(): void
    {
        $this->grantModeratorRole();
        $blockedMoveType = $this->ensureSituationTypes()[SituationType::BLOCKED_MOVE];
        $move = $this->createOpponentMove();
        $this->entityManager->flush();

        $this->client->request('POST', '/api/situations', [], [], $this->jsonHeaders(), json_encode([
            'typeId' => $blockedMoveType->getId(),
            'name' => 'Blocked DP punish',
            'description' => 'Ryu HP DP blocked point blank.',
            'opponentCharacterId' => (string) $move->getCharacter()->getId(),
            'moveId' => (string) $move->getId(),
            'punishWindowFrames' => 30,
            'startingDistanceMeters' => 0.85,
            'opponentState' => 'grounded',
            'cornerState' => 'either',
            'counterHitState' => 'normal',
            'isVerified' => true,
        ]));

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        self::assertSame('Blocked DP punish', $payload['name']);
        self::assertSame('blocked_move', $payload['type']['code']);
        self::assertSame(0.85, $payload['startingDistanceMeters']);
        self::assertTrue($payload['isVerified']);
    }

    public function testDriveImpactSituationRejectsMove(): void
    {
        $this->grantModeratorRole();
        $types = $this->ensureSituationTypes();
        $move = $this->createOpponentMove();
        $this->entityManager->flush();

        $this->client->request('POST', '/api/situations', [], [], $this->jsonHeaders(), json_encode([
            'typeId' => $types[SituationType::DRIVE_IMPACT_PC_STATE]->getId(),
            'name' => 'DI PC wall splat',
            'moveId' => (string) $move->getId(),
            'opponentState' => 'airborne',
            'initialJuggleAltitude' => 'high',
            'cornerState' => 'corner',
            'counterHitState' => 'punish_counter',
        ]));

        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testComboSearchCanFilterBySituationCompatibility(): void
    {
        $blockedMoveType = $this->ensureSituationTypes()[SituationType::BLOCKED_MOVE];
        $opponentMove = $this->createOpponentMove();
        $situation = (new \App\Entity\Situation())
            ->setType($blockedMoveType)
            ->setName('Six frame punish')
            ->setDescription('test')
            ->setMove($opponentMove)
            ->setOpponentCharacter($opponentMove->getCharacter())
            ->setPunishWindowFrames(6)
            ->setOpponentState('grounded')
            ->setCornerState('either')
            ->setCounterHitState('normal');
        $this->entityManager->persist($situation);

        $this->createSearchCombo('Fast Starter Combo', 5);
        $this->createSearchCombo('Slow Starter Combo', 8);
        $this->entityManager->flush();

        $this->client->request('GET', sprintf('/api/combo-sequences?situationId=%d', $situation->getId()), [], [], $this->getHeaders());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        self::assertCount(1, $payload);
        self::assertSame('Fast Starter Combo', $payload[0]['name']);
        self::assertSame('compatible', $payload[0]['compatibility']['status']);
    }

    private function grantModeratorRole(): void
    {
        $user = $this->entityManager->getRepository(User::class)->findOneBy(['username' => 'testuser']);
        self::assertInstanceOf(User::class, $user);
        $user->setRoles(['ROLE_MODERATOR']);
        $this->entityManager->flush();

        static::ensureKernelShutdown();
        $this->client = static::createClient();
        $this->client->disableReboot();
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'testuser',
            'password' => 'testpassword',
        ]));
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->moderatorHeaders = ['HTTP_X_CSRF_TOKEN' => (string) ($payload['csrfToken'] ?? '')];
    }

    /** @return array<string,SituationType> */
    private function ensureSituationTypes(): array
    {
        $rows = [];
        foreach ([
            SituationType::BLOCKED_MOVE => 'Blocked move',
            SituationType::WHIFFED_MOVE => 'Whiffed move',
            SituationType::DRIVE_IMPACT_PC_STATE => 'Drive Impact Punish Counter state',
            SituationType::STUN => 'Stun',
        ] as $code => $name) {
            $type = $this->entityManager->getRepository(SituationType::class)->findOneBy(['code' => $code]);
            if (!$type instanceof SituationType) {
                $type = (new SituationType())->setCode($code)->setName($name)->setDescription($name);
                $this->entityManager->persist($type);
            }
            $rows[$code] = $type;
        }
        $this->entityManager->flush();

        return $rows;
    }

    private function createOpponentMove(): Move
    {
        $character = (new Character())->setName('Ryu');
        $frameData = (new FrameData())->setStartup(5);
        $move = (new Move())->setCharacter($character)->setNumpadNotation('623HP')->setFrameData($frameData);
        $this->entityManager->persist($character);
        $this->entityManager->persist($frameData);
        $this->entityManager->persist($move);

        return $move;
    }

    private function createSearchCombo(string $name, int $startup): ComboSequences
    {
        $comboType = $this->entityManager->getRepository(ComboSequenceType::class)->findOneBy(['name' => 'combo']) ?? (new ComboSequenceType())->setName('combo');
        $leafType = $this->entityManager->getRepository(ComboSequenceType::class)->findOneBy(['name' => 'leaf']) ?? (new ComboSequenceType())->setName('leaf');
        $visibility = $this->entityManager->getRepository(Visibility::class)->findOneBy(['name' => 'public']) ?? (new Visibility())->setName('public');
        $connectionType = $this->entityManager->getRepository(ConnectionType::class)->findOneBy(['name' => 'Initial Move']) ?? (new ConnectionType())->setName('Initial Move');
        $character = (new Character())->setName(sprintf('Akuma %d', $startup));
        $frameData = (new FrameData())->setStartup($startup);
        $move = (new Move())->setCharacter($character)->setNumpadNotation('5MP')->setFrameData($frameData);
        $leaf = (new ComboSequences())->setName(sprintf('Leaf %d', $startup))->setDescription('leaf')->setType($leafType)->setVisibility($visibility)->setMove($move);
        $combo = (new ComboSequences())->setName($name)->setDescription('combo')->setType($comboType)->setVisibility($visibility);
        $step = (new Step())->setChildSequence($leaf)->setOrdinalInCombo(1)->setConnectionType($connectionType);
        $combo->addStep($step);

        foreach ([$comboType, $leafType, $visibility, $connectionType, $character, $frameData, $move, $leaf, $combo, $step] as $entity) {
            $this->entityManager->persist($entity);
        }

        return $combo;
    }

    /** @return array<string,string> */
    private function jsonHeaders(): array
    {
        return array_merge($this->getHeaders(), $this->moderatorHeaders, ['CONTENT_TYPE' => 'application/json']);
    }
}
