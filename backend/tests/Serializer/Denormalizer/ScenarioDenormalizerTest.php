<?php declare(strict_types=1);

namespace App\Tests\Serializer\Denormalizer;

use App\Entity\Scenario;
use App\Entity\ScenarioType;
use App\Entity\Character;
use App\Repository\CharacterRepository;
use App\Tests\DatabaseTestCase;
use Doctrine\ORM\EntityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Serializer\Serializer;

class ScenarioDenormalizerTest extends DatabaseTestCase
{
    private Serializer $serializer;
    private EntityManagerInterface $em;
    /**
     * @var EntityRepository<Character>
     */
    private EntityRepository $characterRepository;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->serializer = static::getContainer()->get('serializer');
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        /** @var CharacterRepository $repository */
        $repository = $this->em->getRepository(Character::class);
        $this->characterRepository = $repository;

        if (!$this->characterRepository->findOneBy(['name' => 'Ryu'])) {
            $character = new Character();
            $character->setName('Ryu');
            $this->em->persist($character);
            $this->em->flush();
        }
    }

    public function testDenormalizeBasicScenario(): void
    {
        $character = $this->characterRepository->findOneBy(['name' => 'Ryu']);

        $data = [
            'name' => 'Test Scenario',
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
                                            'id' => $character->getId(),
                                            'name' => $character->getName(),
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

        /** @var Scenario $scenario */
        $scenario = $this->serializer->denormalize($data, Scenario::class);

        $this->assertInstanceOf(Scenario::class, $scenario);
        $this->assertEquals('Test Scenario', $scenario->getName());
        $this->assertEquals('Okizeme', $scenario->getType()->getName());
        $this->assertCount(1, $scenario->getLayers());
        $this->assertCount(1, $scenario->getLayers()->first()->getFirstPlayerOptions());
    }

    public function testDenormalizeReusesExistingScenarioType(): void
    {
        $type = $this->em->getRepository(ScenarioType::class)
            ->findOneBy(['name' => 'Okizeme']);

        if (!$type) {
            $type = new ScenarioType();
            $type->setName('Okizeme');
            $this->em->persist($type);
            $this->em->flush();
        }

        $data = [
            'name' => 'Another Scenario',
            'type' => 'Okizeme',
            'layers' => [],
        ];

        /** @var Scenario $scenario */
        $scenario = $this->serializer->denormalize($data, Scenario::class);

        $this->assertSame($type, $scenario->getType());
        $this->assertEquals('Okizeme', $scenario->getType()->getName());
    }
}
