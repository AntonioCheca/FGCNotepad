<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\NotationTranslation;
use App\Repository\CharacterRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Loads notation translation rules from an external CSV and checks a replay combo export against them.
 *
 * The CSV is the whole rule set: an import replaces every stored rule. Columns: character (empty = every
 * character), kind (exact|regex), from, to, priority (optional, lower runs first), note (optional).
 */
final class NotationTranslationImportService
{
    private const REQUIRED_HEADERS = ['character', 'kind', 'from', 'to'];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CharacterRepository $characterRepository,
        private readonly ReplayComboStepResolver $stepResolver,
    ) {
    }

    /** Validates the whole file before deleting anything; the caller owns the transaction. */
    public function replaceRules(string $path): int
    {
        $rules = $this->parse($path);

        $this->entityManager->createQuery(sprintf('DELETE FROM %s', NotationTranslation::class))->execute();
        foreach ($rules as $rule) {
            $this->entityManager->persist($rule);
        }
        $this->entityManager->flush();
        $this->stepResolver->clearCache();

        return count($rules);
    }

    /**
     * Resolves every ready combo of a combo export (single document or bundle) with the stored rules, writing nothing.
     *
     * @return array{checked: int, resolved: int, notReady: int, translatedSteps: int, failures: array<string, array<string, int>>}
     */
    public function report(string $bundlePath): array
    {
        $contents = @file_get_contents($bundlePath);
        if (false === $contents) {
            throw new \InvalidArgumentException(sprintf('Cannot read "%s".', $bundlePath));
        }
        $data = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
        $documents = is_array($data['documents'] ?? null) ? $data['documents'] : [$data];

        $report = ['checked' => 0, 'resolved' => 0, 'notReady' => 0, 'translatedSteps' => 0, 'failures' => []];
        $this->stepResolver->clearCache();
        foreach ($documents as $document) {
            foreach (is_array($document['combos'] ?? null) ? $document['combos'] : [] as $combo) {
                if (true !== ($combo['ready_to_export'] ?? null)) {
                    ++$report['notReady'];
                    continue;
                }
                ++$report['checked'];
                $characterName = is_string($combo['character'] ?? null) ? $combo['character'] : '(no character)';
                try {
                    $character = $this->characterRepository->findOneByExportName($characterName);
                    if (!$character instanceof Character) {
                        throw new \InvalidArgumentException(sprintf('Character "%s" is not available in the move catalog.', $characterName));
                    }
                    $resolution = $this->stepResolver->resolve(is_array($combo['sequence'] ?? null) ? $combo['sequence'] : [], $character);
                    ++$report['resolved'];
                    $report['translatedSteps'] += count(array_filter($resolution['notes'], static fn (string $note): bool => str_contains($note, '" read as "')));
                } catch (\InvalidArgumentException $exception) {
                    $report['failures'][$characterName][$exception->getMessage()] = ($report['failures'][$characterName][$exception->getMessage()] ?? 0) + 1;
                }
            }
        }
        ksort($report['failures']);
        foreach ($report['failures'] as &$messages) {
            arsort($messages);
        }

        return $report;
    }

    /** @return list<NotationTranslation> */
    private function parse(string $path): array
    {
        $handle = @fopen($path, 'rb');
        if (false === $handle) {
            throw new \InvalidArgumentException(sprintf('Cannot read "%s".', $path));
        }

        try {
            // No escape character: regex backslashes must reach the rule untouched.
            $headers = fgetcsv($handle, null, ',', '"', '');
            if (!is_array($headers)) {
                throw new \InvalidArgumentException('The CSV is empty.');
            }
            $headers = array_map(static fn (?string $header): string => strtolower(trim((string) $header)), $headers);
            $missing = array_diff(self::REQUIRED_HEADERS, $headers);
            if ([] !== $missing) {
                throw new \InvalidArgumentException(sprintf('Missing CSV columns: %s.', implode(', ', $missing)));
            }

            $rules = [];
            $errors = [];
            $line = 1;
            while (false !== ($row = fgetcsv($handle, null, ',', '"', ''))) {
                ++$line;
                if ([null] === $row || [] === array_filter($row, static fn (?string $value): bool => '' !== trim((string) $value))) {
                    continue;
                }
                $data = array_combine($headers, array_pad(array_slice($row, 0, count($headers)), count($headers), ''));
                try {
                    $rules[] = $this->rule($data);
                } catch (\InvalidArgumentException $exception) {
                    $errors[] = sprintf('line %d: %s', $line, $exception->getMessage());
                }
            }
        } finally {
            fclose($handle);
        }

        if ([] !== $errors) {
            throw new \InvalidArgumentException(sprintf("Nothing imported, %d invalid rows:\n%s", count($errors), implode("\n", $errors)));
        }

        return $rules;
    }

    /** @param array<string, string|null> $data */
    private function rule(array $data): NotationTranslation
    {
        $kind = strtolower(trim((string) $data['kind']));
        if (!in_array($kind, [NotationTranslation::KIND_EXACT, NotationTranslation::KIND_REGEX], true)) {
            throw new \InvalidArgumentException(sprintf('kind must be "exact" or "regex", got "%s".', $kind));
        }
        // Leading/trailing spaces can be meaningful in a replacement ("~" -> " > "), so only "from" is trimmed for exact rules.
        $from = NotationTranslation::KIND_EXACT === $kind ? trim((string) $data['from']) : (string) $data['from'];
        if ('' === $from) {
            throw new \InvalidArgumentException('from must not be empty.');
        }
        if (NotationTranslation::KIND_REGEX === $kind && !ReplayNotationTranslator::isValidRegex($from)) {
            throw new \InvalidArgumentException(sprintf('"%s" is not a valid regular expression.', $from));
        }
        $to = (string) $data['to'];
        if (NotationTranslation::KIND_EXACT === $kind && '' === trim($to)) {
            throw new \InvalidArgumentException('to must not be empty for an exact rule.');
        }

        $priority = trim((string) ($data['priority'] ?? ''));
        if ('' !== $priority && 1 !== preg_match('/^-?\d+$/', $priority)) {
            throw new \InvalidArgumentException(sprintf('priority must be an integer, got "%s".', $priority));
        }

        $characterName = trim((string) $data['character']);
        $character = null;
        if ('' !== $characterName) {
            $character = $this->characterRepository->findOneByExportName($characterName);
            if (!$character instanceof Character) {
                throw new \InvalidArgumentException(sprintf('Unknown character "%s".', $characterName));
            }
        }
        $note = trim((string) ($data['note'] ?? ''));

        return new NotationTranslation($character, $kind, $from, NotationTranslation::KIND_EXACT === $kind ? trim($to) : $to, '' === $priority ? 0 : (int) $priority, '' === $note ? null : $note);
    }
}
