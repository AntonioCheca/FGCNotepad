<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Repository\CharacterRepository;
use App\Util\ReplayMoveNotation;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Creates variant moves (install, status-enhanced, Perfect versions…) from a FAT JSON file, driven by an external CSV.
 *
 * FAT keeps these outside the normal moves: whole alternative sections (e.g. a super install moveset) or a second
 * damage value in parentheses ("600(700)"). The CSV says which ones to import and how to name them:
 *   - kind "section": every move of FAT section `source` becomes "<notation> <target>" (character empty = all).
 *   - kind "alternate": the move `source` becomes `target`, with the parenthesised damage.
 * Re-running updates the variants in place; the regular FAT import never touches them.
 */
final class FrameDataVariantImportService
{
    public const KIND_SECTION = 'section';
    public const KIND_ALTERNATE = 'alternate';

    private const REQUIRED_HEADERS = ['character', 'kind', 'source', 'target'];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CharacterRepository $characterRepository,
        private readonly FrameDataUpsertService $upsertService,
        private readonly FrameDataRecordApplier $recordApplier,
    ) {
    }

    /** @param array<string, mixed> $fatData FAT JSON decoded: character name => {moves: {section => {name => record}}} */
    public function import(string $csvPath, array $fatData, bool $dryRun = false): FrameDataImportResult
    {
        $variants = $this->variants($this->parseCsv($csvPath), $fatData);

        $this->upsertService->resetImportCache();
        $result = new FrameDataImportResult();
        foreach ($variants as ['character' => $character, 'notation' => $notation, 'record' => $record]) {
            [, $frameData, $created] = $this->upsertService->getOrCreateMoveFrameData($character, $notation, $result, $dryRun);
            $warnings = [];
            $changed = $this->recordApplier->applyFatRecord($frameData, $record, $warnings);
            foreach ($warnings as $warning) {
                $result->addWarning(sprintf('Scaling parse warning [%s - %s]: %s', $character->getName(), $notation, $warning));
            }
            if (!$created) {
                $changed ? ++$result->frameDataUpdated : ++$result->unchanged;
            }
            ++$result->processed;
        }

        if (!$dryRun) {
            $this->entityManager->flush();
        }

        return $result;
    }

    /**
     * @param list<array{line: int, character: string, kind: string, source: string, target: string}> $rows
     * @param array<string, mixed> $fatData
     *
     * @return list<array{character: Character, notation: string, record: array<string, mixed>}>
     */
    private function variants(array $rows, array $fatData): array
    {
        $fatByKey = [];
        foreach ($fatData as $name => $characterData) {
            if (is_string($name) && is_array($characterData['moves'] ?? null)) {
                $fatByKey[ReplayMoveNotation::characterKey($name)] = ['name' => $name, 'moves' => $characterData['moves']];
            }
        }

        $variants = [];
        $errors = [];
        foreach ($rows as $row) {
            try {
                $fatCharacters = '' === $row['character']
                    ? array_values($fatByKey)
                    : [$fatByKey[ReplayMoveNotation::characterKey($row['character'])] ?? throw new \InvalidArgumentException(sprintf('Character "%s" is not in the FAT file.', $row['character']))];

                $found = false;
                foreach ($fatCharacters as $fatCharacter) {
                    $section = self::KIND_SECTION === $row['kind'] ? $row['source'] : 'normal';
                    $records = $fatCharacter['moves'][$section] ?? null;
                    if (!is_array($records)) {
                        continue;
                    }
                    $character = $this->characterRepository->findOneByExportName($fatCharacter['name'])
                        ?? throw new \InvalidArgumentException(sprintf('Character "%s" has not been imported yet.', $fatCharacter['name']));

                    if (self::KIND_SECTION === $row['kind']) {
                        foreach ($records as $record) {
                            $notation = is_array($record) && is_string($record['numCmd'] ?? null) ? trim($record['numCmd']) : '';
                            if ('' !== $notation) {
                                $variants[] = ['character' => $character, 'notation' => $notation . ' ' . $row['target'], 'record' => $record];
                                $found = true;
                            }
                        }
                        continue;
                    }

                    $record = $this->recordByNotation($records, $row['source'])
                        ?? throw new \InvalidArgumentException(sprintf('No "%s" move for %s.', $row['source'], $fatCharacter['name']));
                    $variants[] = ['character' => $character, 'notation' => $row['target'], 'record' => $this->alternateRecord($record, $row['source'])];
                    $found = true;
                }
                if (!$found) {
                    throw new \InvalidArgumentException(sprintf('FAT section "%s" not found.', $row['source']));
                }
            } catch (\InvalidArgumentException $exception) {
                $errors[] = sprintf('line %d: %s', $row['line'], $exception->getMessage());
            }
        }

        if ([] !== $errors) {
            throw new \InvalidArgumentException(sprintf("Nothing imported, %d invalid rows:\n%s", count($errors), implode("\n", $errors)));
        }

        return $variants;
    }

    /**
     * @param array<mixed> $records
     *
     * @return array<string, mixed>|null
     */
    private function recordByNotation(array $records, string $notation): ?array
    {
        foreach ($records as $record) {
            if (is_array($record) && is_string($record['numCmd'] ?? null) && trim($record['numCmd']) === $notation) {
                return $record;
            }
        }

        return null;
    }

    /**
     * "600(700)": the value in parentheses is the variant's damage. Anything else ("800 (400*400)" lists hit parts) is rejected.
     *
     * @param array<string, mixed> $record
     *
     * @return array<string, mixed>
     */
    private function alternateRecord(array $record, string $notation): array
    {
        $damage = $record['fullDmg'] ?? $record['dmg'] ?? null;
        if (!is_string($damage) || 1 !== preg_match('/^\s*\d+\s*\(\s*(\d+)\s*\)\s*$/', $damage, $matches)) {
            throw new \InvalidArgumentException(sprintf('"%s" damage %s has no single alternate value in parentheses.', $notation, json_encode($damage)));
        }

        return ['dmg' => (int) $matches[1], 'fullDmg' => null] + $record;
    }

    /** @return list<array{line: int, character: string, kind: string, source: string, target: string}> */
    private function parseCsv(string $path): array
    {
        $handle = @fopen($path, 'rb');
        if (false === $handle) {
            throw new \InvalidArgumentException(sprintf('Cannot read "%s".', $path));
        }

        try {
            $headers = fgetcsv($handle, null, ',', '"', '');
            if (!is_array($headers)) {
                throw new \InvalidArgumentException('The CSV is empty.');
            }
            $headers = array_map(static fn (?string $header): string => strtolower(trim((string) $header)), $headers);
            $missing = array_diff(self::REQUIRED_HEADERS, $headers);
            if ([] !== $missing) {
                throw new \InvalidArgumentException(sprintf('Missing CSV columns: %s.', implode(', ', $missing)));
            }

            $rows = [];
            $errors = [];
            $line = 1;
            while (false !== ($row = fgetcsv($handle, null, ',', '"', ''))) {
                ++$line;
                if ([] === array_filter($row, static fn (?string $value): bool => '' !== trim((string) $value))) {
                    continue;
                }
                $data = array_map(static fn (?string $value): string => trim((string) $value), array_combine($headers, array_pad(array_slice($row, 0, count($headers)), count($headers), '')));
                $kind = strtolower($data['kind']);
                if (!in_array($kind, [self::KIND_SECTION, self::KIND_ALTERNATE], true)) {
                    $errors[] = sprintf('line %d: kind must be "section" or "alternate", got "%s".', $line, $data['kind']);
                } elseif ('' === $data['source'] || '' === $data['target']) {
                    $errors[] = sprintf('line %d: source and target must not be empty.', $line);
                } elseif (self::KIND_ALTERNATE === $kind && '' === $data['character']) {
                    $errors[] = sprintf('line %d: an alternate row needs a character.', $line);
                } else {
                    $rows[] = ['line' => $line, 'character' => $data['character'], 'kind' => $kind, 'source' => $data['source'], 'target' => $data['target']];
                }
            }
        } finally {
            fclose($handle);
        }

        if ([] !== $errors) {
            throw new \InvalidArgumentException(sprintf("Nothing imported, %d invalid rows:\n%s", count($errors), implode("\n", $errors)));
        }

        return $rows;
    }
}
