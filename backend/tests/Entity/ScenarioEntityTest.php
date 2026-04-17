<?php declare(strict_types=1);

namespace App\Tests\Entity;

use App\Entity\Scenario;
use App\Entity\Character;
use App\Entity\Move;
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
        $defender = (new Character())->setName('Ryu');
        $attacker = (new Character())->setName('Ken');
        $triggerMove = (new Move())->setCharacter($attacker)->setNumpadNotation('2MK');
        $this->em->persist($defender);
        $this->em->persist($attacker);
        $this->em->persist($triggerMove);

        $scenario = (new Scenario())
            ->setName('Frame Trap Test')
            ->setScenarioType('oki')
            ->setDefenderCharacter($defender)
            ->setAttackerCharacter($attacker)
            ->setTriggerMove($triggerMove);

        $this->em->persist($scenario);
        $this->em->flush();
        $this->em->clear();

        /** @var Scenario $saved */
        $saved = $this->em->getRepository(Scenario::class)->find($scenario->getId());

        self::assertNotNull($saved);
        self::assertTrue(Uuid::isValid($saved->getPublicId()->toRfc4122()));
        self::assertSame('frame trap test', $saved->getSearchLabel());
        self::assertSame('oki', $saved->getScenarioType());
        self::assertSame('Ryu', $saved->getDefenderCharacter()?->getName());
        self::assertSame('Ken', $saved->getAttackerCharacter()?->getName());
        self::assertSame('Ken - 2MK', $saved->getTriggerMove()?->getName());
        self::assertNotNull($saved->getCreatedAt());
        self::assertNotNull($saved->getUpdatedAt());
    }
}
