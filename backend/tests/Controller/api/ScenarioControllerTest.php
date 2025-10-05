<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Scenario;
use App\Entity\ScenarioType;
use App\Repository\ScenarioRepository;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Response;

class ScenarioControllerTest extends AuthenticatedWebTestCase
{
    private EntityManagerInterface $em;
    private ScenarioRepository $scenarioRepository;
    private ?Character $character = null;

    public function setUp(): void
    {
        parent::setUp();

        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->scenarioRepository = $this->em->getRepository(Scenario::class);

        // Ensure at least one Character exists
        $this->character = $this->em->getRepository(Character::class)->findOneBy(['name' => 'Ryu']);
        if (!$this->character) {
            $this->character = new Character();
            $this->character->setName('Ryu');
            $this->em->persist($this->character);
            $this->em->flush();
        }
    }

    public function testListScenarios(): void
    {
        $this->client->request('GET', '/api/scenarios', [], [], $this->getHeaders());
        $response = $this->client->getResponse();

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());
    }

    public function testCreateScenario(): void
    {
        $this->addExpectedTypeJsonToHeaders();
        $this->addContentTypeJsonToHeaders();
        $data = [
            'name' => 'Test Scenario API',
            'type' => 'Okizeme',
            'layers' => [
                [
                    'index' => 0,
                    'firstPlayerOptions' => [
                        [
                            'parts' => [
                                [
                                    'framesOfDuration' => 3,
                                    'index' => 0,
                                    'move' => [
                                        'numpadNotation' => '5LP',
                                        'character' => [
                                            'id' => $this->character->getId(),
                                            'name' => $this->character->getName(),
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'secondPlayerOptions' => [],
                ],
            ],
        ];

        $this->client->request(
            'POST',
            '/api/scenarios',
            [],
            [],
            $this->getHeaders(),
            json_encode($data)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_CREATED, $response->getStatusCode());
        $this->assertJson($response->getContent());
    }

    public function testReadScenario(): void
    {
        // Create a scenario first
        $scenario = new Scenario();
        $scenario->setName('Read Test Scenario');
        $type = $this->em->getRepository(ScenarioType::class)->findOneBy(['name' => 'Okizeme']);
        if (!$type) {
            $type = new ScenarioType();
            $type->setName('Okizeme');
            $this->em->persist($type);
            $this->em->flush();
        }
        $scenario->setType($type);
        $this->em->persist($scenario);
        $this->em->flush();

        $this->client->request(
            'GET',
            '/api/scenarios/' . $scenario->getId(),
            [],
            [],
            $this->getHeaders()
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());
    }

    public function testUpdateScenario(): void
    {
        // Create a scenario first
        $scenario = new Scenario();
        $scenario->setName('Update Test Scenario');
        $type = $this->em->getRepository(ScenarioType::class)->findOneBy(['name' => 'Okizeme']);
        if (!$type) {
            $type = new ScenarioType();
            $type->setName('Okizeme');
            $this->em->persist($type);
            $this->em->flush();
        }
        $scenario->setType($type);
        $this->em->persist($scenario);
        $this->em->flush();

        $updateData = ['name' => 'Updated Scenario Name'];

        $this->client->request(
            'PATCH',
            '/api/scenarios/' . $scenario->getId(),
            [],
            [],
            $this->getHeaders(),
            json_encode($updateData)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());

        $this->em->refresh($scenario);
        $this->assertEquals('Updated Scenario Name', $scenario->getName());
    }

    public function testDeleteScenario(): void
    {
        $scenario = new Scenario();
        $scenario->setName('Delete Test Scenario');
        $type = $this->em->getRepository(ScenarioType::class)->findOneBy(['name' => 'Okizeme']);
        if (!$type) {
            $type = new ScenarioType();
            $type->setName('Okizeme');
            $this->em->persist($type);
            $this->em->flush();
        }
        $scenario->setType($type);
        $this->em->persist($scenario);
        $this->em->flush();

        $this->client->request(
            'DELETE',
            '/api/scenarios/' . $scenario->getId(),
            [],
            [],
            $this->getHeaders()
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_NO_CONTENT, $response->getStatusCode());
    }
}
