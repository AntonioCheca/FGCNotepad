<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Scenario;
use App\Entity\ScenarioType;
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

    public function testListScenariosReturnsLightweightContract(): void
    {
        $scenario = $this->createScenario('Throw Bait');

        $this->client->request('GET', '/api/scenarios', [], [], $this->getHeaders());
        $response = $this->client->getResponse();

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        $payload = json_decode((string) $response->getContent(), true);
        self::assertIsArray($payload);
        self::assertNotEmpty($payload);

        $first = $payload[0];
        self::assertArrayHasKey('id', $first);
        self::assertArrayHasKey('name', $first);
        self::assertArrayHasKey('label', $first);
        self::assertArrayHasKey('type', $first);
        self::assertSame($scenario->getPublicId()->toRfc4122(), $first['id']);
    }

    public function testListScenariosSupportsSearchQuery(): void
    {
        $this->createScenario('Throw Loop');
        $this->createScenario('Whiff Punish');

        $this->client->request('GET', '/api/scenarios?q=throw', [], [], $this->getHeaders());
        $response = $this->client->getResponse();

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        $payload = json_decode((string) $response->getContent(), true);
        self::assertCount(1, $payload);
        self::assertSame('Throw Loop', $payload[0]['name']);
    }

    public function testReadScenarioByPublicId(): void
    {
        $scenario = $this->createScenario('Corner Trap', ['matrix' => ['value' => 1]]);

        $this->client->request('GET', '/api/scenarios/' . $scenario->getPublicId()->toRfc4122(), [], [], $this->getHeaders());
        $response = $this->client->getResponse();

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        $payload = json_decode((string) $response->getContent(), true);
        self::assertSame($scenario->getPublicId()->toRfc4122(), $payload['id']);
        self::assertSame('Corner Trap', $payload['name']);
        self::assertSame(['matrix' => ['value' => 1]], $payload['payload']);
    }

    public function testReadScenarioReturns404ForUnknownId(): void
    {
        $this->client->request('GET', '/api/scenarios/' . Uuid::v7()->toRfc4122(), [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    public function testReadScenarioReturns404ForInvalidIdFormat(): void
    {
        $this->client->request('GET', '/api/scenarios/not-a-uuid', [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    private function createScenario(string $name, array $payload = []): Scenario
    {
        $type = $this->em->getRepository(ScenarioType::class)->findOneBy(['name' => 'MatrixRef']) ?? (new ScenarioType())->setName('MatrixRef');
        $this->em->persist($type);

        $scenario = (new Scenario())
            ->setName($name)
            ->setType($type)
            ->setPayload($payload);

        $this->em->persist($scenario);
        $this->em->flush();

        return $scenario;
    }
}
