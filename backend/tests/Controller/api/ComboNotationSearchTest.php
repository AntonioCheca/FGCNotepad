<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\User;
use App\Entity\Visibility;
use App\Service\ComboSequenceCreationService;
use App\Tests\DatabaseTestCase;
use Symfony\Component\HttpFoundation\Response;

final class ComboNotationSearchTest extends DatabaseTestCase
{
    /** @var array<string, ConnectionType> */
    private array $connections = [];
    /** @var array<string, ComboSequences> */
    private array $leafs = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
        $this->login();
    }

    public function testNotationSeparatesStepsByTheirConnectionType(): void
    {
        $this->createCombo('replay combo', [
            ['2MP', 'Initial Move'],
            ['236HP', 'Special'],
            ['5LP', 'Link'],
            ['DR', 'Link'],
            ['5HP', 'Link'],
            ['214MP', 'DR Cancel'],
            ['214214HP', 'Super Cancel'],
        ]);
        $this->createCombo('walk combo', [['5LP', 'Initial Move'], ['5HP', 'Walk Forward'], ['2MP', 'Walk Back']]);

        $notations = array_column($this->search([]), 'executionNotation', 'name');

        self::assertSame('2MP xx 236HP, 5LP, DR 5HP DRC 214MP xx 214214HP', $notations['replay combo']);
        self::assertSame('5LP, walk, 5HP, walk back, 2MP', $notations['walk combo']);
    }

    public function testSearchMatchesMovesInComboOrderAndIgnoresTheName(): void
    {
        $special = $this->createCombo('2MP named combo', [['5LP', 'Initial Move'], ['2MP', 'Link'], ['236HP', 'Special']]);
        $reversed = $this->createCombo('reversed', [['2MP', 'Initial Move'], ['5LP', 'Link']]);

        self::assertSame([$special->getId()], $this->searchIds('5lp, 2mp xx 236hp'));
        self::assertSame([$special->getId()], $this->searchIds('5LP 236HP'), 'Moves need not be adjacent.');
        self::assertSame([$reversed->getId()], $this->searchIds('2MP DRC 5LP'), 'Separator words are not moves.');
        self::assertSame([$special->getId()], $this->searchIds('2MP 23'), 'The last move may be partially typed.');
        self::assertSame([], $this->searchIds('named'));
        self::assertSame([], $this->searchIds('2M 236HP'), 'Only the last move matches by prefix.');
    }

    /** @return list<int> */
    private function searchIds(string $query): array
    {
        return array_column($this->search(['q' => $query]), 'id');
    }

    /** @param list<array{0: string, 1: string}> $steps */
    private function createCombo(string $name, array $steps): ComboSequences
    {
        $payloadSteps = [];
        foreach ($steps as $index => [$notation, $connection]) {
            $payloadSteps[] = [
                'child_sequence_id' => $this->leafs[$notation]->getId(),
                'ordinal_in_combo' => $index + 1,
                'connection_type_id' => $this->connections[$connection]->getId(),
            ];
        }

        return $this->client->getContainer()->get(ComboSequenceCreationService::class)
            ->createFromPayload(['name' => $name, 'description' => '', 'visibility' => 'public', 'metrics' => ['damage' => 1000]], 'combo', $payloadSteps);
    }

    private function seedCatalog(): void
    {
        $character = (new Character())->setName('Ryu');
        $leafType = (new ComboSequenceType())->setName('leaf');
        $visibility = (new Visibility())->setName('public');
        foreach ([$character, $leafType, $visibility, (new ComboSequenceType())->setName('combo')] as $entity) {
            $this->entityManager->persist($entity);
        }

        foreach (['Initial Move', 'Link', 'Special', 'DR Cancel', 'Super Cancel', 'Walk Forward', 'Walk Back'] as $name) {
            $this->connections[$name] = (new ConnectionType())->setName($name);
            $this->entityManager->persist($this->connections[$name]);
        }

        foreach (['2MP' => 'normal', '5LP' => 'normal', '5HP' => 'normal', 'DR' => 'normal', '236HP' => 'special', '214MP' => 'special', '214214HP' => 'super'] as $notation => $moveType) {
            $frameData = (new FrameData())->setMoveType($moveType)->setDamage(500);
            $move = (new Move())->setCharacter($character)->setNumpadNotation($notation);
            $move->setFrameData($frameData);
            $leaf = (new ComboSequences())->setName('Ryu - ' . $notation)->setDescription('leaf')->setMove($move)->setType($leafType)->setVisibility($visibility);
            $this->entityManager->persist($frameData);
            $this->entityManager->persist($move);
            $this->entityManager->persist($leaf);
            $this->leafs[$notation] = $leaf;
        }
        $this->entityManager->flush();
    }

    private function login(): void
    {
        $user = (new User())->setUsername('notation_searcher')->setPassword(self::hashTestPassword())->setRoles([])->setIsActive(true);
        $this->entityManager->persist($user);
        $this->entityManager->flush();
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['username' => 'notation_searcher', 'password' => 'testpassword']));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }

    /**
     * @param array<string, mixed> $query
     *
     * @return list<array<string, mixed>>
     */
    private function search(array $query): array
    {
        $this->client->request('GET', '/api/combo-sequences', $query);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        return json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }
}
