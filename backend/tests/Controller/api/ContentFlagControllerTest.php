<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboFlag;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\Move;
use App\Entity\Scenario;
use App\Entity\ScenarioFlag;
use App\Entity\User;
use App\Entity\Visibility;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Response;

class ContentFlagControllerTest extends AuthenticatedWebTestCase
{
    private EntityManagerInterface $em;

    public function setUp(): void
    {
        parent::setUp();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
    }

    public function testCreateScenarioFlagWithComment(): void
    {
        $scenario = $this->createScenario();

        $this->client->request(
            'POST',
            '/api/flags/scenarios',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode([
                'scenarioId' => $scenario->getPublicId()->toRfc4122(),
                'comment' => 'Damage seems too high for this starter.',
            ])
        );

        self::assertSame(
            Response::HTTP_CREATED,
            $this->client->getResponse()->getStatusCode(),
            (string) $this->client->getResponse()->getContent()
        );
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame('Damage seems too high for this starter.', $payload['comment']);

        $flag = $this->em->getRepository(ScenarioFlag::class)->find($payload['id']);
        self::assertInstanceOf(ScenarioFlag::class, $flag);
        self::assertSame($scenario->getId(), $flag->getScenario()->getId());
    }

    public function testCreateScenarioFlagWithoutCommentStoresNull(): void
    {
        $scenario = $this->createScenario();

        $this->client->request(
            'POST',
            '/api/flags/scenarios',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode([
                'scenarioId' => $scenario->getPublicId()->toRfc4122(),
            ])
        );

        self::assertSame(
            Response::HTTP_CREATED,
            $this->client->getResponse()->getStatusCode(),
            (string) $this->client->getResponse()->getContent()
        );
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertNull($payload['comment']);

        $flag = $this->em->getRepository(ScenarioFlag::class)->find($payload['id']);
        self::assertInstanceOf(ScenarioFlag::class, $flag);
        self::assertNull($flag->getComment());
    }

    public function testCreateComboFlagWithComment(): void
    {
        $combo = $this->createCombo();

        $this->client->request(
            'POST',
            '/api/flags/combos',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode([
                'comboId' => $combo->getId(),
                'comment' => 'The listed link is inconsistent with frame data.',
            ])
        );

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame('The listed link is inconsistent with frame data.', $payload['comment']);

        $flag = $this->em->getRepository(ComboFlag::class)->find($payload['id']);
        self::assertInstanceOf(ComboFlag::class, $flag);
        self::assertSame($combo->getId(), $flag->getCombo()->getId());

        $reportedBy = $this->em->getRepository(User::class)->findOneBy(['username' => 'testuser']);
        self::assertInstanceOf(User::class, $reportedBy);
        self::assertSame($reportedBy->getId()?->toRfc4122(), $flag->getReportedBy()->getId()?->toRfc4122());
    }

    private function createScenario(): Scenario
    {
        $defender = (new Character())->setName('Ryu');
        $attacker = (new Character())->setName('Ken');
        $triggerMove = (new Move())->setCharacter($attacker)->setNumpadNotation('5HP');

        $scenario = (new Scenario())
            ->setName('Flaggable Scenario')
            ->setScenarioType('oki')
            ->setDefenderCharacter($defender)
            ->setAttackerCharacter($attacker)
            ->setTriggerMove($triggerMove);

        $this->em->persist($defender);
        $this->em->persist($attacker);
        $this->em->persist($triggerMove);
        $this->em->persist($scenario);
        $this->em->flush();

        return $scenario;
    }

    private function getJsonHeaders(): array
    {
        $headers = $this->getHeaders();
        if (isset($headers['HTTP_Authorization'])) {
            $headers['HTTP_AUTHORIZATION'] = $headers['HTTP_Authorization'];
        }

        $headers['CONTENT_TYPE'] = 'application/json';

        return $headers;
    }

    private function createCombo(): ComboSequences
    {
        $comboType = (new ComboSequenceType())->setName('combo');
        $visibility = (new Visibility())->setName('public');

        $combo = (new ComboSequences())
            ->setName('Flaggable Combo')
            ->setDescription('Combo for flag test')
            ->setType($comboType)
            ->setVisibility($visibility);

        $this->em->persist($comboType);
        $this->em->persist($visibility);
        $this->em->persist($combo);
        $this->em->flush();

        return $combo;
    }
}
