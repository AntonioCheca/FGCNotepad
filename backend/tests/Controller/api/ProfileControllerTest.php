<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboMetrics;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\Move;
use App\Entity\Step;
use App\Entity\Visibility;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Response;

class ProfileControllerTest extends AuthenticatedWebTestCase
{
    private EntityManagerInterface $em;

    public function setUp(): void
    {
        parent::setUp();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
    }

    public function testGetExecutionPreferenceReturnsStandardDefaults(): void
    {
        $this->client->request('GET', '/api/profile/execution-preference', [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame('standard', $payload['defaultMode']);
        self::assertNull($payload['difficultyCap']);
    }

    public function testUpdateExecutionPreferencePersistsDifficultyCap(): void
    {
        $this->client->request(
            'PUT',
            '/api/profile/execution-preference',
            [],
            [],
            $this->getHeaders(),
            json_encode([
                'defaultMode' => 'difficulty_cap',
                'difficultyCap' => 4,
            ])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame('difficulty_cap', $payload['defaultMode']);
        self::assertSame(4, $payload['difficultyCap']);

        $this->client->request('GET', '/api/profile/execution-preference', [], [], $this->getHeaders());
        $fetched = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame('difficulty_cap', $fetched['defaultMode']);
        self::assertSame(4, $fetched['difficultyCap']);
    }

    public function testUpdateComboKnowledgeStoresKnownComboIdsForCharacter(): void
    {
        [$character, $comboOne, $comboTwo] = $this->seedCharacterCombos();

        $this->client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'username' => 'testuser',
                'password' => 'testpassword',
            ])
        );
        $loginPayload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $authHeaders = [
            'HTTP_AUTHORIZATION' => sprintf('Bearer %s', (string) ($loginPayload['token'] ?? '')),
            'CONTENT_TYPE' => 'application/json',
        ];

        $this->client->request(
            'PUT',
            '/api/profile/combo-knowledge',
            [],
            [],
            $authHeaders,
            json_encode([
                'characterId' => $character->getId()?->toRfc4122(),
                'knownComboIds' => [$comboTwo->getId()],
            ])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request(
            'GET',
            sprintf('/api/profile/combo-knowledge?characterId=%s', $character->getId()?->toRfc4122()),
            [],
            [],
            ['HTTP_AUTHORIZATION' => $authHeaders['HTTP_AUTHORIZATION']]
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertCount(2, $payload['combos']);
        $byId = [];
        foreach ($payload['combos'] as $comboRow) {
            $byId[(int) $comboRow['id']] = $comboRow;
        }

        self::assertFalse($byId[$comboOne->getId()]['known']);
        self::assertTrue($byId[$comboTwo->getId()]['known']);
    }

    /**
     * @return array{Character, ComboSequences, ComboSequences}
     */
    private function seedCharacterCombos(): array
    {
        $character = (new Character())->setName('Juri');
        $this->em->persist($character);

        $leafType = (new ComboSequenceType())->setName('leaf');
        $comboType = (new ComboSequenceType())->setName('combo');
        $visibility = (new Visibility())->setName('public');
        $connectionType = (new ConnectionType())->setName('Initial Move');

        $this->em->persist($leafType);
        $this->em->persist($comboType);
        $this->em->persist($visibility);
        $this->em->persist($connectionType);

        $starterMove = (new Move())
            ->setCharacter($character)
            ->setNumpadNotation('5MP');
        $this->em->persist($starterMove);

        $starterLeaf = (new ComboSequences())
            ->setName('Juri 5MP')
            ->setDescription('leaf')
            ->setType($leafType)
            ->setVisibility($visibility)
            ->setMove($starterMove);
        $this->em->persist($starterLeaf);

        $comboOne = (new ComboSequences())
            ->setName('Juri Easy Route')
            ->setDescription('combo')
            ->setType($comboType)
            ->setVisibility($visibility);
        $this->em->persist($comboOne);

        $comboTwo = (new ComboSequences())
            ->setName('Juri Medium Route')
            ->setDescription('combo')
            ->setType($comboType)
            ->setVisibility($visibility);
        $this->em->persist($comboTwo);

        $this->em->persist((new ComboMetrics())->setSequence($comboOne)->setDamage(1200)->setDifficultyLevel(2));
        $this->em->persist((new ComboMetrics())->setSequence($comboTwo)->setDamage(1700)->setDifficultyLevel(4));

        $this->em->persist((new Step())->setParentSequence($comboOne)->setChildSequence($starterLeaf)->setOrdinalInCombo(1)->setConnectionType($connectionType));
        $this->em->persist((new Step())->setParentSequence($comboTwo)->setChildSequence($starterLeaf)->setOrdinalInCombo(1)->setConnectionType($connectionType));

        $this->em->flush();

        return [$character, $comboOne, $comboTwo];
    }
}
