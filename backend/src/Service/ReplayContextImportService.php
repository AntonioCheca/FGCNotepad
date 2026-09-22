<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\ComboObservation;
use App\Entity\ComboSequences;
use App\Entity\OkiSetup;
use App\Entity\OkiSetupObservation;
use App\Entity\Replay;
use App\Entity\ReplayPlayer;
use App\Repository\CharacterRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Stores the replay_context block of combo/Oki exports and the per-occurrence observations.
 *
 * Everything in the export is untrusted. Values only reach the database through Doctrine bound parameters,
 * text is kept verbatim except for what PostgreSQL cannot store (NUL bytes, invalid UTF-8) and a length cap,
 * and anything that is not the expected type becomes null instead of failing the import.
 */
final class ReplayContextImportService
{
    private const NAME_LIMIT = 255;
    private const LABEL_LIMIT = 64;

    /** @var array<string, Character|null> */
    private array $characterCache = [];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CharacterRepository $characterRepository,
    ) {
    }

    /** Clear entity-backed lookups after a bundle document before Doctrine clears its unit of work. */
    public function clearCache(): void
    {
        $this->characterCache = [];
    }

    /**
     * Upserts the replay and its players from an export document. Expects `source.replay_id` and
     * `source.source_sha256` to be validated non-empty strings already.
     *
     * @param array<string, mixed> $document
     */
    public function upsert(array $document): Replay
    {
        $source = is_array($document['source'] ?? null) ? $document['source'] : [];
        $extractorReplayId = $this->text($source['replay_id'] ?? null, self::LABEL_LIMIT) ?? '';
        $sha256 = $this->text($source['source_sha256'] ?? null, self::LABEL_LIMIT) ?? '';

        $replay = $this->entityManager->getRepository(Replay::class)->findOneBy(['extractorReplayId' => $extractorReplayId]);
        if (!$replay instanceof Replay) {
            $replay = new Replay($extractorReplayId, $sha256);
            $this->entityManager->persist($replay);
        } elseif ($replay->getSourceSha256() !== $sha256) {
            // Re-extraction: occurrence ids are only stable inside one generated document, so drop the stale ones.
            $this->deleteObservations($replay);
            $replay->setSourceSha256($sha256);
        }
        $replay->setExtractorSchemaVersion($this->text($source['extractor_schema_version'] ?? null, 32));

        $context = is_array($document['replay_context'] ?? null) ? $document['replay_context'] : [];
        $available = true === ($context['metadata_available'] ?? null) && is_array($context['replay'] ?? null);
        if ($available) {
            $this->applyReplayMetadata($replay, $context['replay']);
        }

        foreach (is_array($context['players'] ?? null) ? $context['players'] : [] as $playerData) {
            if (!is_array($playerData) || !in_array($playerData['slot'] ?? null, [1, 2], true)) {
                continue;
            }
            $player = $replay->getPlayerBySlot($playerData['slot']);
            $isNew = !$player instanceof ReplayPlayer;
            if ($isNew) {
                $player = new ReplayPlayer($replay, $playerData['slot']);
                $this->entityManager->persist($player);
            }
            // Older exports carry identity only; they must not erase a rank stored from a newer extraction.
            if ($available || $isNew) {
                $this->applyPlayer($player, $playerData);
            }
        }

        $this->entityManager->flush();

        return $replay;
    }

    public function hasComboObservation(Replay $replay, string $occurrenceId): bool
    {
        return null !== $this->entityManager->getRepository(ComboObservation::class)->findOneBy(['replay' => $replay, 'occurrenceId' => $this->text($occurrenceId, self::LABEL_LIMIT) ?? '']);
    }

    /** @param array<string, mixed> $combo the export combo (player_slot, damage and start_* are read defensively) */
    public function recordComboObservation(Replay $replay, ComboSequences $sequence, string $occurrenceId, array $combo): void
    {
        $this->entityManager->persist(new ComboObservation(
            $sequence,
            $replay,
            $this->playerForSlot($replay, $combo['player_slot'] ?? null),
            $this->text($occurrenceId, self::LABEL_LIMIT) ?? '',
            $this->int32($combo['damage'] ?? null),
            $this->int32($combo['start_round_timer'] ?? null),
            $this->int32($combo['start_replay_frame'] ?? null),
            $this->int32($combo['start_source_index'] ?? null),
        ));
    }

    public function hasOkiObservation(Replay $replay, string $occurrenceId): bool
    {
        return null !== $this->entityManager->getRepository(OkiSetupObservation::class)->findOneBy(['replay' => $replay, 'occurrenceId' => $this->text($occurrenceId, self::LABEL_LIMIT) ?? '']);
    }

    public function recordOkiObservation(Replay $replay, OkiSetup $setup, string $occurrenceId, mixed $attackerSlot, mixed $defenderSlot): void
    {
        $this->entityManager->persist(new OkiSetupObservation(
            $setup,
            $replay,
            $this->playerForSlot($replay, $attackerSlot),
            $this->playerForSlot($replay, $defenderSlot),
            $this->text($occurrenceId, self::LABEL_LIMIT) ?? '',
        ));
    }

    /** @return array{metadataAvailable: bool, uploadedAt: string|null} */
    public function summarize(Replay $replay): array
    {
        return [
            'metadataAvailable' => $replay->isMetadataAvailable(),
            'uploadedAt' => $replay->getUploadedAt()?->format(DATE_ATOM),
        ];
    }

    private function deleteObservations(Replay $replay): void
    {
        foreach ([ComboObservation::class, OkiSetupObservation::class] as $class) {
            $this->entityManager->createQueryBuilder()
                ->delete($class, 'o')
                ->where('o.replay = :replay')
                ->setParameter('replay', $replay)
                ->getQuery()
                ->execute();
        }
    }

    private function playerForSlot(Replay $replay, mixed $slot): ?ReplayPlayer
    {
        return is_int($slot) ? $replay->getPlayerBySlot($slot) : null;
    }

    /** @param array<string, mixed> $data */
    private function applyReplayMetadata(Replay $replay, array $data): void
    {
        $uploadedUnix = $this->int($data['uploaded_at_unix'] ?? null);
        $capturedUnix = $this->int($data['captured_at_unix'] ?? null);
        $uploadedRaw = $this->int($data['uploaded_at_raw'] ?? null);

        $replay
            ->setMetadataAvailable(true)
            ->setUploadedAt($this->fromUnix($uploadedUnix))
            ->setUploadedAtRaw(null === $uploadedRaw ? null : (string) $uploadedRaw)
            ->setUploadedAtUnit($this->text($data['uploaded_at_unit'] ?? null, 8))
            ->setCapturedAt($this->fromUnix($capturedUnix))
            ->setBattleVersion($this->int32($data['battle_version'] ?? null))
            ->setLocalVersion($this->int32($data['local_version'] ?? null))
            ->setRoundNum($this->smallInt($data['round_num'] ?? null))
            ->setStageId($this->int32($data['stage_id'] ?? null))
            ->setBattleTypeRaw($this->int32($data['battle_type_raw'] ?? null))
            ->setGameModeRaw($this->int32($data['game_mode_raw'] ?? null))
            ->setBattleSubTypeRaw($this->int32($data['battle_sub_type_raw'] ?? null))
            ->setReplayTabRaw($this->int32($data['replay_tab_raw'] ?? null))
            ->setBattleType($this->text($data['battle_type'] ?? null, self::LABEL_LIMIT))
            ->setGameMode($this->text($data['game_mode'] ?? null, self::LABEL_LIMIT))
            ->setReplayTab($this->text($data['replay_tab'] ?? null, self::LABEL_LIMIT))
            ->setIsRegistered($this->bool($data['is_registered'] ?? null))
            ->setIsRivalAi($this->bool($data['is_rival_ai'] ?? null));
    }

    /** @param array<string, mixed> $data */
    private function applyPlayer(ReplayPlayer $player, array $data): void
    {
        $characterName = $this->text($data['character'] ?? null, self::LABEL_LIMIT);
        $shortId = $this->int($data['short_id'] ?? null);

        $player
            ->setCharacterIdRaw($this->int32($data['character_id'] ?? null))
            ->setCharacterName($characterName)
            ->setCharacter($this->resolveCharacter($characterName))
            ->setCfnName($this->text($data['cfn_name'] ?? null, self::NAME_LIMIT))
            ->setShortId(null === $shortId ? null : (string) $shortId)
            ->setRegion($this->text($data['region'] ?? null, self::LABEL_LIMIT))
            ->setRegionId($this->int32($data['region_id'] ?? null))
            ->setHomeId($this->int32($data['home_id'] ?? null))
            ->setHomeCategoryId($this->int32($data['home_category_id'] ?? null));

        $rank = is_array($data['rank'] ?? null) ? $data['rank'] : [];
        $player
            ->setRankMetric($this->text($rank['metric'] ?? null, 8))
            ->setRankValue($this->int32($rank['value'] ?? null))
            ->setIsMaster($this->bool($rank['is_master'] ?? null))
            ->setIsLegend($this->bool($rank['is_legend'] ?? null))
            ->setIsUnranked($this->bool($rank['is_unranked'] ?? null))
            ->setLeagueRank($this->int32($rank['league_rank'] ?? null))
            ->setLeaguePoint($this->int32($rank['league_point'] ?? null))
            ->setLeagueTier($this->text($rank['league_tier'] ?? null, 32))
            ->setLeagueDivision($this->smallInt($rank['league_division'] ?? null))
            ->setMasterRating($this->int32($rank['master_rating'] ?? null))
            ->setMasterRatingRanking($this->int32($rank['master_rating_ranking'] ?? null))
            ->setMasterLeague($this->int32($rank['master_league'] ?? null))
            ->setMasterTier($this->text($rank['master_tier'] ?? null, 32))
            ->setMrTier($this->text($rank['mr_tier'] ?? null, 32));
    }

    private function resolveCharacter(?string $name): ?Character
    {
        if (null === $name) {
            return null;
        }
        if (!array_key_exists($name, $this->characterCache)) {
            $character = $this->characterRepository->findOneByExportName($name);
            $this->characterCache[$name] = $character instanceof Character ? $character : null;
        }

        return $this->characterCache[$name];
    }

    /** Verbatim text minus NUL bytes and invalid UTF-8, capped by characters. Never HTML-escaped: escaping is the renderer's job. */
    private function text(mixed $value, int $limit): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $clean = str_replace("\0", '', mb_scrub($value, 'UTF-8'));
        if ('' === $clean) {
            return null;
        }

        return mb_substr($clean, 0, $limit, 'UTF-8');
    }

    private function int(mixed $value): ?int
    {
        return is_int($value) ? $value : null;
    }

    private function int32(mixed $value): ?int
    {
        return is_int($value) && $value >= -2147483648 && $value <= 2147483647 ? $value : null;
    }

    private function smallInt(mixed $value): ?int
    {
        return is_int($value) && $value >= -32768 && $value <= 32767 ? $value : null;
    }

    private function bool(mixed $value): ?bool
    {
        return is_bool($value) ? $value : null;
    }

    private function fromUnix(?int $seconds): ?\DateTimeImmutable
    {
        if (null === $seconds || $seconds < 0 || $seconds > 4102444800) {
            return null;
        }

        return (new \DateTimeImmutable('@' . $seconds))->setTimezone(new \DateTimeZone('UTC'));
    }
}
