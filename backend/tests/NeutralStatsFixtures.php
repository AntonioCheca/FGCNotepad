<?php declare(strict_types=1);

namespace App\Tests;

use App\Entity\Character;
use App\Entity\CharacterObject;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\User;
use App\Util\Enum\UserRole;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Component\HttpFoundation\Response;

/**
 * Builds a small neutral catalogue (Ryu and Manon with named moves and resources) and neutral_stats_bundle_v2
 * documents for it.
 *
 * @property EntityManagerInterface|null $entityManager
 * @property KernelBrowser|null $client
 */
trait NeutralStatsFixtures
{
    private const RYU_MOVES = [
        ['5LP', 'Stand LP', 'normal'],
        ['5HP', 'Stand HP', 'normal'],
        ['2MK', 'Crouch MK', 'normal'],
        ['6MP', 'Collarbone Breaker', 'normal'],
        ['236LP', 'LP Hadoken', 'special'],
        ['236PP', 'OD Hadoken', 'special'],
        ['HPHK', 'Drive Impact', 'drive'],
    ];

    private const MANON_MOVES = [
        ['5MP', 'Stand MP', 'normal'],
        ['2LK', 'Crouch LK', 'normal'],
    ];

    /** @return array{ryu: Character, manon: Character} */
    private function persistNeutralCatalog(): array
    {
        $ryu = (new Character())->setName('Ryu');
        $manon = (new Character())->setName('Manon')->setLife(10000);
        $this->entityManager->persist($ryu);
        $this->entityManager->persist($manon);

        foreach ([[$ryu, self::RYU_MOVES], [$manon, self::MANON_MOVES]] as [$character, $moves]) {
            foreach ($moves as [$notation, $name, $type]) {
                $frameData = (new FrameData())->setMoveType($type)->setCancelsTo('[]')->setMoveName($name);
                $move = (new Move())->setCharacter($character)->setNumpadNotation($notation)->setFrameData($frameData);
                $this->entityManager->persist($frameData);
                $this->entityManager->persist($move);
            }
        }

        $this->entityManager->persist(
            (new CharacterObject())
                ->setCharacter($manon)
                ->setCharacterName('Manon')
                ->setObjectKey('manon_medals')
                ->setName('Medals')
                ->setKind(CharacterObject::KIND_SCALER)
                ->setStatusType('integer')
                ->setMaxStatus(5)
                ->setExtractorSource(CharacterObject::SOURCE_NAMED)
                ->setExtractorKey('medal_level')
        );
        $this->entityManager->persist(
            (new CharacterObject())
                ->setCharacter($ryu)
                ->setCharacterName('Ryu')
                ->setObjectKey('ryu_denjin')
                ->setName('Denjin')
                ->setKind(CharacterObject::KIND_STATE)
                ->setStatusType('boolean')
                ->setExtractorSource(CharacterObject::SOURCE_INSTALL)
                ->setExtractorKey('install')
        );
        $this->entityManager->flush();

        return ['ryu' => $ryu, 'manon' => $manon];
    }

    /**
     * @param list<array<string, mixed>> $replays
     *
     * @return array<string, mixed>
     */
    private function neutralBundle(array $replays): array
    {
        return [
            'format' => 'neutral_stats_bundle_v2',
            'algorithm_name' => 'neutral_move_usage',
            'algorithm_version' => '2',
            'spacing_bin_width' => 0.25,
            'replay_count' => count($replays),
            'replays' => $replays,
        ];
    }

    /**
     * @param array<string, mixed> $options sha, mode, version, players (slot => overrides)
     * @param list<array<string, mixed>> $observations
     *
     * @return array<string, mixed>
     */
    private function neutralReplay(string $replayId, array $observations, array $options = []): array
    {
        $players = [];
        foreach ([1 => 'Ryu', 2 => 'Manon'] as $slot => $character) {
            $overrides = $options['players'][$slot] ?? [];
            $mr = array_key_exists('mr', $overrides) ? $overrides['mr'] : 1900;
            $player = [
                'slot' => $slot,
                'character' => $overrides['character'] ?? $character,
                'region' => $overrides['region'] ?? 'tokyo',
                'rank' => null === $mr
                    ? ['metric' => 'LP', 'value' => 20000, 'is_master' => false, 'league_rank' => $overrides['leagueRank'] ?? 31, 'master_rating' => 0]
                    : ['metric' => 'MR', 'value' => $mr, 'is_master' => true, 'is_legend' => $overrides['legend'] ?? false, 'league_rank' => 36, 'master_rating' => $mr],
            ];
            if (array_key_exists('control', $overrides)) {
                $player['control_scheme'] = $overrides['control'];
            }
            $players[] = $player;
        }

        return [
            'source' => ['replay_id' => $replayId, 'source_sha256' => $options['sha'] ?? str_repeat('a', 64), 'extractor_schema_version' => '0.30'],
            'replay_context' => [
                'metadata_available' => true,
                'replay' => ['battle_version' => $options['version'] ?? 20004000, 'game_mode' => $options['mode'] ?? 'RANKED_MATCH', 'battle_type' => 'ranked'],
                'players' => $players,
            ],
            'summary' => ['observation_count' => count($observations)],
            'observations' => array_values(array_map(
                fn (array $observation, int $index): array => $this->neutralObservation($replayId, $index, $observation),
                $observations,
                array_keys($observations),
            )),
        ];
    }

    /**
     * @param array<string, mixed> $overrides notation, spacing, route, slot, drive, super, health, resources, install
     *
     * @return array<string, mixed>
     */
    private function neutralObservation(string $replayId, int $index, array $overrides): array
    {
        $slot = $overrides['slot'] ?? 1;
        $notation = $overrides['notation'] ?? '5LP';
        $route = $overrides['route'] ?? 'raw';
        $state = static fn (int $stateSlot, array $values): array => [
            'slot' => $stateSlot,
            'health' => $values['health'] ?? 10000,
            'drive' => $values['drive'] ?? 60000,
            'super' => $values['super'] ?? 0,
            'resources' => $values['resources'] ?? [],
            'install' => $values['install'] ?? null,
        ];

        return [
            'id' => sprintf('%s:i%d:p%d', $replayId, $index, $slot),
            'player_slot' => $slot,
            'opponent_slot' => 1 === $slot ? 2 : 1,
            'round_number' => 1,
            'round_timer' => 99,
            'replay_frame' => 100 + $index,
            'source_index' => 500 + $index,
            'action_id' => $overrides['actionId'] ?? 600 + $index,
            'catalogue_category' => 'normal_command_or_contextual',
            'move_name' => $overrides['moveName'] ?? $notation,
            'notation' => $notation,
            'spacing' => $overrides['spacing'] ?? 1.1,
            'spacing_bin_start' => 1.0,
            'route' => $route,
            'route_label' => 'drive_rush' === $route ? 'DR > ' . $notation : $notation,
            'entered_from' => 'WALK',
            'player_states' => [
                $state($slot, $overrides),
                $state(1 === $slot ? 2 : 1, $overrides['opponent'] ?? []),
            ],
        ];
    }

    private function createNeutralUser(UserRole $role): User
    {
        $user = (new User())
            ->setUsername(sprintf('user_%s', bin2hex(random_bytes(4))))
            ->setPassword(self::hashTestPassword())
            ->setRoles([$role->value])
            ->setIsActive(true);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    /** @return array<string, string> */
    private function neutralLoginHeaders(User $user): array
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $user->getUsername(),
            'password' => 'testpassword',
        ], JSON_THROW_ON_ERROR));
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return ['HTTP_X_CSRF_TOKEN' => (string) $payload['csrfToken'], 'CONTENT_TYPE' => 'application/json'];
    }

    /**
     * @param array<string, mixed> $bundle
     *
     * @return array<string, mixed>
     */
    private function importNeutralBundle(array $bundle): array
    {
        $headers = $this->neutralLoginHeaders($this->createNeutralUser(UserRole::ADMIN));
        $this->client->request('POST', '/api/admin/neutral-stats-imports', [], [], $headers, json_encode($bundle, JSON_THROW_ON_ERROR));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $result = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->client->getCookieJar()->clear();

        return $result;
    }
}
