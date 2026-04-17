<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\Scenario;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;

class ScenarioControllerTest extends AuthenticatedWebTestCase
{
    private EntityManagerInterface $em;

    public function setUp(): void
    {
        parent::setUp();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
    }

    public function testCreateAndReadScenario(): void
    {
        [$defender, $attacker, $triggerMove] = $this->createScenarioActors();

        $this->client->request('POST', '/api/scenarios', [], [], $this->getHeaders(), json_encode([
            'name' => 'Corner Oki Test',
            'scenarioType' => 'oki',
            'defenderCharacterId' => $defender->getId()?->toRfc4122(),
            'attackerCharacterId' => $attacker->getId()?->toRfc4122(),
            'triggerMoveId' => $triggerMove->getId()?->toRfc4122(),
            'matrix' => $this->buildMatrixPayload(),
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());
        $created = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->client->request('GET', '/api/scenarios/' . $created['id'], [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame('Corner Oki Test', $payload['name']);
        self::assertSame('oki', $payload['scenarioType']);
        self::assertSame($defender->getId()?->toRfc4122(), $payload['defenderCharacterId']);
        self::assertSame($attacker->getId()?->toRfc4122(), $payload['attackerCharacterId']);
        self::assertSame($triggerMove->getId()?->toRfc4122(), $payload['triggerMoveId']);
        self::assertSame('matrix-editor', $payload['matrix']['kind']);
    }

    public function testListScenariosSupportsFilters(): void
    {
        [$defender, $attacker, $triggerMove] = $this->createScenarioActors();
        $scenario = $this->createScenario('Throw Loop Oki', 'oki', $defender, $attacker, $triggerMove);

        $this->client->request('GET', sprintf('/api/scenarios?q=throw&scenarioType=oki&defenderCharacterId=%s', $defender->getId()?->toRfc4122()), [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertCount(1, $payload);
        self::assertSame($scenario->getPublicId()->toRfc4122(), $payload[0]['id']);
    }

    public function testReadScenarioReturns404ForInvalidIdFormat(): void
    {
        $this->client->request('GET', '/api/scenarios/not-a-uuid', [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    public function testReadScenarioReturns404ForUnknownId(): void
    {
        $this->client->request('GET', '/api/scenarios/' . Uuid::v7()->toRfc4122(), [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    /**
     * @return array{Character, Character, Move}
     */
    private function createScenarioActors(): array
    {
        $defender = (new Character())->setName('Ryu');
        $attacker = (new Character())->setName('Cammy');
        $triggerMove = (new Move())->setCharacter($attacker)->setNumpadNotation('2HP');

        $this->em->persist($defender);
        $this->em->persist($attacker);
        $this->em->persist($triggerMove);
        $this->em->flush();

        return [$defender, $attacker, $triggerMove];
    }

    private function createScenario(
        string $name,
        string $scenarioType,
        Character $defender,
        Character $attacker,
        Move $triggerMove,
    ): Scenario {
        $scenario = (new Scenario())
            ->setName($name)
            ->setScenarioType($scenarioType)
            ->setDefenderCharacter($defender)
            ->setAttackerCharacter($attacker)
            ->setTriggerMove($triggerMove);

        $scenarioRow = (new \App\Entity\ScenarioRow())
            ->setScenario($scenario)
            ->setPosition(0)
            ->setLabel('Defend')
            ->setSummaryValue(0.5);

        $scenarioColumn = (new \App\Entity\ScenarioColumn())
            ->setScenario($scenario)
            ->setPosition(0)
            ->setLabel('Meaty')
            ->setSummaryValue(0.5);

        $scenarioCell = (new \App\Entity\ScenarioCell())
            ->setScenario($scenario)
            ->setRow($scenarioRow)
            ->setColumn($scenarioColumn)
            ->setKind(\App\Entity\ScenarioCell::KIND_STATIC)
            ->setStaticValue(20.0);

        $scenario->addRow($scenarioRow);
        $scenario->addColumn($scenarioColumn);
        $scenario->addCell($scenarioCell);

        $this->em->persist($scenario);
        $this->em->flush();

        return $scenario;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildMatrixPayload(): array
    {
        return [
            'kind' => 'matrix-editor',
            'schemaVersion' => 1,
            'axes' => [
                'rows' => ['Defend'],
                'columns' => ['Meaty'],
            ],
            'cells' => [[[
                'cellType' => 'value',
                'dataType' => 'number',
                'value' => 20,
            ]]],
            'summary' => [
                'rowAxis' => [[
                    'cellType' => 'summary',
                    'dataType' => 'number',
                    'value' => 0.5,
                ]],
                'columnAxis' => [[
                    'cellType' => 'summary',
                    'dataType' => 'number',
                    'value' => 0.5,
                ]],
                'expectedValue' => [
                    'cellType' => 'summary',
                    'dataType' => 'empty',
                    'value' => null,
                ],
            ],
            'metadata' => [
                'matrixId' => 'mx_controller_test',
                'title' => 'Corner Oki Test',
            ],
        ];
    }
}
