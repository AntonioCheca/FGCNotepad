<?php declare(strict_types=1);

namespace App\Tests\Entity;

use App\Entity\Scenario;
use App\Entity\ScenarioType;
use App\Tests\DatabaseTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Uid\Uuid;

class ScenarioEntityTest extends DatabaseTestCase
{
    private EntityManagerInterface $em;

    public function setUp(): void
    {
        parent::setUp();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
    }

    public function testScenarioPersistsCanonicalFields(): void
    {
        $type = (new ScenarioType())->setName('MatrixRef');
        $this->em->persist($type);

        $scenario = (new Scenario())
            ->setName('Frame Trap Test')
            ->setType($type)
            ->setPayload(['source' => 'unit-test', 'value' => 9]);

        $this->em->persist($scenario);
        $this->em->flush();
        $this->em->clear();

        /** @var Scenario $saved */
        $saved = $this->em->getRepository(Scenario::class)->find($scenario->getId());

        self::assertNotNull($saved);
        self::assertTrue(Uuid::isValid($saved->getPublicId()->toRfc4122()));
        self::assertSame('frame trap test', $saved->getSearchLabel());
        self::assertEquals(['source' => 'unit-test', 'value' => 9], $saved->getPayload());
        self::assertNotNull($saved->getCreatedAt());
        self::assertNotNull($saved->getUpdatedAt());
    }
}
