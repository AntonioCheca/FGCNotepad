<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Tests\Controller\AuthenticatedWebTestCase;
use App\Util\Enum\MoveType;
use Symfony\Component\HttpFoundation\Response;

final class GuideControllerTest extends AuthenticatedWebTestCase
{
    public function testTurnsGuideClassifiesSupportedMoveListsAndKeepsUnsupportedSpacingListsEmpty(): void
    {
        $character = $this->persistCharacter('Ryu');
        $plusNormal = $this->persistMove($character, '5MP', MoveType::NORMAL->value, 2, 6);
        $commandNormal = $this->persistMove($character, '6HP', MoveType::NORMAL->value, 3, 7);
        $plusSpecial = $this->persistMove($character, '214P', MoveType::SPECIAL->value, 1, 0);
        $this->persistMove($character, '2MP', MoveType::NORMAL->value, 0, 4);
        $this->persistMove($character, '8LP', MoveType::NORMAL->value, 7, 0);
        $this->persistMove($character, '7 or 9HK', MoveType::NORMAL->value, 11, 0);
        $this->persistMove($character, 'j.LP', MoveType::NORMAL->value, 5, 0);
        $this->persistMove($character, '9 > 2HP', MoveType::NORMAL->value, 4, 0);
        $this->persistMove($character, '236P', MoveType::SPECIAL->value, -4, 0);

        $this->client->request('GET', '/api/guides/turns', [], [], $this->getHeaders());

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        self::assertSame(Response::HTTP_OK, $response->getStatusCode(), (string) $response->getContent());
        self::assertSame('Beginner Turns Heuristics', $payload['title']);
        self::assertCount(10, $payload['heuristics']);
        self::assertSame('Some plus buttons', $payload['heuristics'][2]['title']);
        self::assertSame('Some plus specials', $payload['heuristics'][3]['title']);
        self::assertSame('Some well spaced normals', $payload['heuristics'][4]['title']);
        self::assertSame('Some well spaced specials', $payload['heuristics'][5]['title']);
        self::assertSame('Drive Rush pressure', $payload['heuristics'][6]['title']);
        self::assertSame('Blocked dive-kicks low', $payload['heuristics'][8]['title']);
        self::assertSame('Both players jumping', $payload['heuristics'][9]['title']);

        self::assertSame([(string) $plusNormal->getId(), (string) $commandNormal->getId()], array_column($payload['sections']['plusNormals']['moves'], 'id'));
        self::assertSame([(string) $plusSpecial->getId()], array_column($payload['sections']['plusSpecials']['moves'], 'id'));
        self::assertArrayNotHasKey('driveRushNormals', $payload['sections']);
        self::assertSame('planned_data_column', $payload['sections']['spacedNormals']['status']);
        self::assertSame([], $payload['sections']['spacedNormals']['moves']);
        self::assertSame('planned_data_column', $payload['sections']['spacedSpecials']['status']);
        self::assertSame([], $payload['sections']['spacedSpecials']['moves']);
    }

    private function persistCharacter(string $name): Character
    {
        $character = (new Character())->setName($name);
        $this->entityManager->persist($character);
        $this->entityManager->flush();

        return $character;
    }

    private function persistMove(Character $character, string $notation, string $moveType, int $onBlock, int $onBlockAfterDriveRush): Move
    {
        $frameData = (new FrameData())
            ->setStartup(5)
            ->setActive(3)
            ->setRecovery(10)
            ->setTotal(17)
            ->setOnHit(4)
            ->setOnBlock($onBlock)
            ->setOnPunishCounter(6)
            ->setMoveType($moveType)
            ->setCancelsTo('[]')
            ->setOnBlockAfterDriveRush($onBlockAfterDriveRush);

        $move = (new Move())
            ->setCharacter($character)
            ->setNumpadNotation($notation)
            ->setFrameData($frameData);

        $this->entityManager->persist($frameData);
        $this->entityManager->persist($move);
        $this->entityManager->flush();

        return $move;
    }
}
