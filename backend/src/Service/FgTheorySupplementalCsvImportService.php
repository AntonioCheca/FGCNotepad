<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\FrameDataImportBatch;
use App\Entity\FrameDataSupplementalValue;
use App\Repository\FrameDataSupplementalValueRepository;
use Doctrine\ORM\EntityManagerInterface;

final class FgTheorySupplementalCsvImportService
{
    /** @var array<string, string> */
    private const HEADER_TO_COLUMN = [
        'startup' => 'startup', 'active' => 'active', 'recovery' => 'recovery', 'total' => 'total',
        'on_hit' => 'onHit', 'on_block' => 'onBlock', 'on_punish_counter' => 'onPunishCounter',
        'move_type' => 'moveType', 'cancels_to' => 'cancelsTo', 'damage' => 'damage', 'scaling' => 'scaling',
        'chip_damage' => 'chipDamage', 'attack_level' => 'attackLevel',
        'on_hit_after_drive_rush' => 'onHitAfterDriveRush', 'on_block_after_drive_rush' => 'onBlockAfterDriveRush',
        'on_perfect_parry' => 'onPerfectParry', 'drive_damage_on_hit' => 'driveDamageOnHit',
        'drive_damage_on_block' => 'driveDamageOnBlock', 'drive_gain' => 'driveGain',
        'on_hit_self_super_meter_gain' => 'onHitSelfSuperMeterGain',
        'on_block_self_super_meter_gain' => 'onBlockSelfSuperMeterGain',
        'on_hit_opponent_super_meter_gain' => 'onHitOpponentSuperMeterGain',
        'on_block_opponent_super_meter_gain' => 'onBlockOpponentSuperMeterGain',
        'hit_confirm_specials_and_supers' => 'hitConfirmSpecialsAndSupers',
        'hit_confirm_target_combos' => 'hitConfirmTargetCombos', 'juggle_limit' => 'juggleLimit',
        'juggle_increase' => 'juggleIncrease', 'juggle_start' => 'juggleStart', 'hitstun' => 'hitstun',
        'blockstun' => 'blockstun', 'hitstop' => 'hitstop', 'extra_information' => 'extraInformation',
    ];

    /** @var list<string> */
    private const INTEGER_COLUMNS = [
        'startup', 'active', 'recovery', 'total', 'onHit', 'onBlock', 'onPunishCounter', 'damage', 'chipDamage',
        'onHitAfterDriveRush', 'onBlockAfterDriveRush', 'onPerfectParry', 'driveDamageOnHit', 'driveDamageOnBlock',
        'driveGain', 'onHitSelfSuperMeterGain', 'onBlockSelfSuperMeterGain', 'onHitOpponentSuperMeterGain',
        'onBlockOpponentSuperMeterGain', 'hitConfirmSpecialsAndSupers', 'hitConfirmTargetCombos', 'juggleLimit',
        'juggleIncrease', 'juggleStart', 'hitstun', 'blockstun', 'hitstop',
    ];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly FrameDataUpsertService $upsertService,
        private readonly FrameDataRecordApplier $recordApplier,
        private readonly FrameDataScalingNormalizerService $scalingNormalizer,
        private readonly FrameDataSupplementalValueRepository $supplementalValueRepository,
    ) {
    }

    public function import(string $path, string $label, bool $dryRun = false): FrameDataImportResult
    {
        if (!is_file($path)) {
            throw new \InvalidArgumentException(sprintf('CSV file not found at "%s".', $path));
        }

        $handle = fopen($path, 'rb');
        if (false === $handle) {
            throw new \RuntimeException(sprintf('Unable to open CSV file "%s".', $path));
        }

        $headers = fgetcsv($handle);
        if (!is_array($headers)) {
            fclose($handle);
            throw new \InvalidArgumentException('CSV file must contain a header row.');
        }

        $headers = array_map(static fn (string $header): string => trim($header), $headers);
        $this->assertRequiredHeaders($headers);

        $result = new FrameDataImportResult();
        $this->upsertService->resetImportCache();
        $batch = (new FrameDataImportBatch())
            ->setSourceType(FrameDataImportBatch::SOURCE_SUPPLEMENTAL)
            ->setLabel($label)
            ->setSourceReference(basename($path));

        if (!$dryRun) {
            $this->entityManager->persist($batch);
        }

        $lineNumber = 1;
        while (($row = fgetcsv($handle)) !== false) {
            ++$lineNumber;
            $data = $this->combineRow($headers, $row);
            if ($this->isEmptyRow($data)) {
                continue;
            }

            try {
                $this->importRow($batch, $data, $result, $dryRun);
            } catch (\InvalidArgumentException $exception) {
                $result->addWarning(sprintf('Line %d skipped: %s', $lineNumber, $exception->getMessage()));
                ++$result->skipped;
            }
        }

        fclose($handle);

        if (!$dryRun) {
            $this->entityManager->flush();
        }

        return $result;
    }

    /** @param array<string, string> $data */
    private function importRow(FrameDataImportBatch $batch, array $data, FrameDataImportResult $result, bool $dryRun): void
    {
        $characterName = trim($data['character_name'] ?? '');
        $numpadNotation = trim($data['numpad_notation'] ?? '');
        if ('' === $characterName || '' === $numpadNotation) {
            throw new \InvalidArgumentException('character_name and numpad_notation are required.');
        }

        $characterLife = $this->parseOptionalInt($data['character_life'] ?? '') ?? 10000;
        $character = $this->upsertService->getOrCreateCharacter($characterName, $characterLife, $result, $dryRun);
        [$move, $frameData, $createdFrameData] = $this->upsertService->getOrCreateMoveFrameData($character, $numpadNotation, $result, $dryRun);
        $values = $this->parseSupplementalValues($data);

        if ($createdFrameData && [] !== $values && !$dryRun) {
            $this->recordApplier->applyValues($frameData, array_filter($values, static fn (mixed $value): bool => null !== $value));
        }

        if (!$dryRun) {
            $supplemental = $this->supplementalValueRepository->findOneByBatchAndMove($batch, $move) ?? (new FrameDataSupplementalValue())->setImportBatch($batch)->setMove($move);
            $supplemental->setMoveName($data['move_name'] ?? null);
            foreach ($values as $columnName => $value) {
                $supplemental->setValue($columnName, $value);
            }
            $this->entityManager->persist($supplemental);
        }

        ++$result->processed;
    }

    /** @param array<string, string> $data @return array<string, mixed> */
    private function parseSupplementalValues(array $data): array
    {
        $values = [];
        foreach (self::HEADER_TO_COLUMN as $header => $columnName) {
            $raw = trim($data[$header] ?? '');
            if ('' === $raw) {
                continue;
            }

            if ('cancelsTo' === $columnName) {
                $values[$columnName] = json_encode(array_values(array_filter(array_map('trim', explode(',', $raw))))) ?: '[]';
                continue;
            }

            $values[$columnName] = in_array($columnName, self::INTEGER_COLUMNS, true) ? $this->parseRequiredInt($raw, $header) : $raw;
        }

        if (!array_key_exists('damage', $values) && '' !== trim($data['full_damage'] ?? '')) {
            $values['damage'] = $this->recordApplier->parseDamageValue($data['full_damage']);
        }

        if (array_key_exists('scaling', $values)) {
            $scaling = $this->scalingNormalizer->normalize((string) $values['scaling']);
            $values['scalingStartPercent'] = $scaling->startPercent;
            $values['scalingImmediatePercent'] = $scaling->immediatePercent;
            $values['scalingMinimumPercent'] = $scaling->minimumPercent;
            $values['scalingComboHits'] = $scaling->comboHits;
            $values['scalingComboExtraPercent'] = $scaling->comboExtraPercent;
            $values['scalingMultiplierPercent'] = $scaling->multiplierPercent;
            $values['scalingParseStatus'] = $scaling->parseStatus;
            $values['scalingParseNote'] = $scaling->parseNote;
        }

        return $values;
    }

    private function parseRequiredInt(string $value, string $header): int
    {
        $normalized = str_replace(',', '', trim($value));
        if (preg_match('/-?\d+/', $normalized, $matches) !== 1) {
            return 0;
        }

        return (int) $matches[0];
    }

    private function parseOptionalInt(string $value): ?int
    {
        $trimmed = trim($value);
        if ('' === $trimmed) {
            return null;
        }

        return $this->parseRequiredInt($trimmed, 'character_life');
    }

    /** @param list<string> $headers */
    private function assertRequiredHeaders(array $headers): void
    {
        foreach (['character_name', 'numpad_notation'] as $requiredHeader) {
            if (!in_array($requiredHeader, $headers, true)) {
                throw new \InvalidArgumentException(sprintf('CSV header "%s" is required.', $requiredHeader));
            }
        }
    }

    /** @param list<string> $headers @param list<string|null> $row @return array<string, string> */
    private function combineRow(array $headers, array $row): array
    {
        $data = [];
        foreach ($headers as $index => $header) {
            $data[$header] = (string) ($row[$index] ?? '');
        }

        return $data;
    }

    /** @param array<string, string> $data */
    private function isEmptyRow(array $data): bool
    {
        foreach ($data as $value) {
            if ('' !== trim($value)) {
                return false;
            }
        }

        return true;
    }
}
