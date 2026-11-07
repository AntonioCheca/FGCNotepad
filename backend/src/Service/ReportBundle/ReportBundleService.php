<?php declare(strict_types=1);

namespace App\Service\ReportBundle;

use App\Entity\ComboSequences;
use App\Entity\Scenario;
use App\Entity\ScenarioResourceGrid;
use App\Entity\User;
use App\Repository\ComboSequencesRepository;
use App\Repository\ScenarioRepository;
use App\Service\ComboDuplicateFinder;
use App\Service\ComboSequenceCreationService;
use App\Service\ModerationTransitionService;
use App\Service\ScenarioResourceGridService;
use App\Service\ScenarioTransfer\ScenarioExportService;
use App\Service\ScenarioTransfer\ScenarioImportService;
use App\Util\Enum\ModerationState;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * One file with everything a research report needs on the site: its combos, its scenarios and their resource grids.
 * Built locally from the console; imported by a moderator, approved as it lands, so nothing waits in the queue.
 * The import is all-or-nothing, and a dry run performs the whole import and rolls it back.
 */
class ReportBundleService
{
    public const FORMAT = 'report_bundle_v1';
    public const STATUS_OK = 'ok';
    public const STATUS_INVALID = 'invalid';
    public const STATUS_CONFLICT = 'conflict';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly ScenarioRepository $scenarioRepository,
        private readonly ReportBundleComboCodec $comboCodec,
        private readonly ComboDuplicateFinder $comboDuplicateFinder,
        private readonly ComboSequenceCreationService $comboSequenceCreationService,
        private readonly ModerationTransitionService $moderationTransitionService,
        private readonly ScenarioExportService $scenarioExportService,
        private readonly ScenarioImportService $scenarioImportService,
        private readonly ScenarioResourceGridService $resourceGridService,
    ) {
    }

    /**
     * @param list<string> $characterNames approved combos started by these characters
     *
     * @return array<string, mixed>
     */
    public function build(string $report, array $characterNames, string $scenarioSource): array
    {
        $scenarios = $this->scenarioRepository->findByImportSource($scenarioSource);
        $grids = array_values(array_filter(array_map(
            fn (Scenario $scenario): ?ScenarioResourceGrid => $this->resourceGridService->findFor($scenario),
            $scenarios,
        )));

        return [
            'format' => self::FORMAT,
            'report' => $report,
            'generatedAt' => (new \DateTimeImmutable())->format(\DATE_ATOM),
            'combos' => array_map(
                fn (ComboSequences $combo): array => $this->comboCodec->export($combo),
                $this->comboSequencesRepository->findApprovedCombosByStarterCharacterNames($characterNames),
            ),
            'scenarios' => $this->scenarioExportService->exportDocument($scenarios),
            'resourceGrids' => $this->resourceGridService->exportDocument($grids),
        ];
    }

    /**
     * @param array<mixed> $document
     *
     * @return array<string, mixed>
     */
    public function import(array $document, User $actor, bool $dryRun, bool $overwriteSiteEdits = false): array
    {
        $errors = $this->validate($document);
        if ([] !== $errors) {
            return ['status' => self::STATUS_INVALID, 'dryRun' => $dryRun, 'imported' => false, 'errors' => $errors];
        }

        $connection = $this->entityManager->getConnection();
        $connection->beginTransaction();
        try {
            $report = $this->write($document, $actor, $overwriteSiteEdits);
            if ($dryRun || self::STATUS_OK !== $report['status']) {
                $connection->rollBack();
                $this->entityManager->clear();
            } else {
                $connection->commit();
            }
        } catch (\Throwable $exception) {
            if ($connection->isTransactionActive()) {
                $connection->rollBack();
            }
            $this->entityManager->clear();
            throw $exception;
        }

        return ['dryRun' => $dryRun, 'imported' => !$dryRun && self::STATUS_OK === $report['status'], 'report' => $document['report']] + $report;
    }

    /**
     * @param array<mixed> $document
     *
     * @return list<string>
     */
    private function validate(array $document): array
    {
        $errors = [];
        if (self::FORMAT !== ($document['format'] ?? null)) {
            $errors[] = sprintf('format must be %s.', self::FORMAT);
        }
        if (!is_string($document['report'] ?? null) || '' === trim($document['report'])) {
            $errors[] = 'report must name the report.';
        }
        foreach (['combos', 'scenarios', 'resourceGrids'] as $section) {
            if (!is_array($document[$section] ?? null)) {
                $errors[] = sprintf('%s is missing.', $section);
            }
        }

        return $errors;
    }

    /**
     * @param array<mixed> $document
     *
     * @return array<string, mixed>
     */
    private function write(array $document, User $actor, bool $overwriteSiteEdits): array
    {
        $combos = $this->importCombos($document['combos'], $actor);
        if ([] !== $combos['errors']) {
            return ['status' => self::STATUS_INVALID, 'errors' => $combos['errors'], 'combos' => $combos['counts']];
        }

        $scenarioResult = $this->scenarioImportService->import($document['scenarios'], $actor, $overwriteSiteEdits);
        if (ScenarioImportService::STATUS_OK !== $scenarioResult['status']) {
            $status = ScenarioImportService::STATUS_CONFLICT === $scenarioResult['status'] ? self::STATUS_CONFLICT : self::STATUS_INVALID;

            return ['status' => $status, 'errors' => $this->scenarioErrors($scenarioResult), 'combos' => $combos['counts'], 'scenarios' => $this->scenarioSummary($scenarioResult)];
        }
        $this->approveScenarios($scenarioResult['scenarios'], $actor);

        $grids = $this->resourceGridService->importDocument($document['resourceGrids']);
        if ([] !== $grids['skipped']) {
            return ['status' => self::STATUS_INVALID, 'errors' => array_map(static fn (string $reason): string => 'Resource grid skipped: ' . $reason, $grids['skipped']), 'combos' => $combos['counts']];
        }

        return [
            'status' => self::STATUS_OK,
            'errors' => [],
            'combos' => $combos['counts'],
            'scenarios' => $this->scenarioSummary($scenarioResult),
            'resourceGrids' => count($grids['imported']),
        ];
    }

    /**
     * Combos already on the site (same moves, conditions and damage) are kept and approved if they were not.
     *
     * @param array<mixed> $entries
     *
     * @return array{counts: array{created: int, existing: int, approvedExisting: int}, errors: list<string>}
     */
    private function importCombos(array $entries, User $actor): array
    {
        $counts = ['created' => 0, 'existing' => 0, 'approvedExisting' => 0];
        $errors = [];
        foreach (array_values($entries) as $index => $entry) {
            try {
                if (!is_array($entry)) {
                    throw new \InvalidArgumentException('must be an object.');
                }
                $payload = $this->comboCodec->toCreationPayload($entry);
                $existing = $this->comboDuplicateFinder->findExactDuplicate($payload);
                if ($existing instanceof ComboSequences) {
                    $wasApproved = ModerationState::APPROVED->value === $existing->getModerationState();
                    if (!$wasApproved) {
                        $this->moderationTransitionService->approveCombo($existing, $actor);
                    }
                    ++$counts[$wasApproved ? 'existing' : 'approvedExisting'];
                    continue;
                }

                $combo = $this->comboSequenceCreationService->createFromPayload($payload, 'combo', $payload['steps'], $actor, false);
                $combo->setIsEssential(true === ($entry['isEssential'] ?? false));
                $this->moderationTransitionService->submitComboForReview($combo);
                $this->moderationTransitionService->approveCombo($combo, $actor);
                $this->entityManager->flush();
                ++$counts['created'];
            } catch (\InvalidArgumentException|HttpException $exception) {
                $errors[] = sprintf('combos[%d] (%s): %s', $index, is_array($entry) ? (string) ($entry['name'] ?? '') : '', $exception->getMessage());
            }
        }
        $this->entityManager->flush();

        return ['counts' => $counts, 'errors' => $errors];
    }

    /**
     * @param list<array<string, mixed>> $results
     */
    private function approveScenarios(array $results, User $actor): void
    {
        foreach ($results as $result) {
            $scenario = $this->scenarioRepository->findOneByPublicId($result['id']);
            if ($scenario instanceof Scenario && ModerationState::APPROVED->value !== $scenario->getModerationState()) {
                $this->moderationTransitionService->approveScenario($scenario, $actor);
            }
        }
        $this->entityManager->flush();
    }

    /**
     * @param array<string, mixed> $result
     *
     * @return list<array{name: string, action: string}>
     */
    private function scenarioSummary(array $result): array
    {
        return array_map(
            static fn (array $entry): array => ['name' => (string) $entry['name'], 'action' => (string) $entry['action']],
            $result['scenarios'] ?? [],
        );
    }

    /**
     * @param array<string, mixed> $result
     *
     * @return list<string>
     */
    private function scenarioErrors(array $result): array
    {
        $errors = array_map(
            static fn (mixed $error): string => is_array($error) ? trim(sprintf('%s %s', $error['path'] ?? '', $error['message'] ?? '')) : (string) $error,
            $result['errors'] ?? [],
        );
        foreach ($result['scenarios'] ?? [] as $entry) {
            if (ScenarioImportService::ACTION_CONFLICT === ($entry['action'] ?? null)) {
                $errors[] = sprintf('"%s" was edited on the site since its last import.', $entry['name']);
            }
            foreach ($entry['unresolvedStarters'] ?? [] as $path) {
                $errors[] = sprintf('"%s": no combo for the starter at %s.', $entry['name'], $path);
            }
        }

        return $errors;
    }
}
