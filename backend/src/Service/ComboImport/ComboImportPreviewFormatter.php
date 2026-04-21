<?php declare(strict_types=1);

namespace App\Service\ComboImport;

use App\Service\ComboImport\Model\ImportExecutionReport;
use Symfony\Component\Console\Output\OutputInterface;

class ComboImportPreviewFormatter
{
    public function format(ImportExecutionReport $report, OutputInterface $output): void
    {
        $output->writeln(sprintf('Total lines read: %d', $report->totalLines));
        $output->writeln(sprintf('Candidate combo lines: %d', $report->candidateLines));
        $output->writeln(sprintf('Valid combos: %d', $report->validCombos));
        $output->writeln(sprintf('Partial combos: %d', $report->partialCombos));
        $output->writeln(sprintf('Discarded lines: %d', $report->discardedLines));
        $output->writeln(sprintf('Persisted combos: %d', $report->persistedCombos));

        if ([] !== $report->warnings) {
            $output->writeln(sprintf('Warnings: %d', count($report->warnings)));
            if ($output->isVerbose()) {
                foreach ($report->warnings as $warning) {
                    $output->writeln(sprintf(' - %s', $warning));
                }
            }
        }

        if ([] === $report->previews) {
            $output->writeln('No combo previews available.');

            return;
        }

        $output->writeln('--- Combo preview ---');

        foreach ($report->previews as $preview) {
            $output->writeln(sprintf('[line %d] status=%s', $preview->lineNumber, $preview->status));
            if (null !== $preview->section) {
                $output->writeln(sprintf(' section: %s', $preview->section));
            }
            $output->writeln(sprintf(' raw: %s', $preview->comboRaw));
            $output->writeln(sprintf(' normalized: %s', $preview->notationNormalized ?? '(none)'));
            $output->writeln(sprintf(' damage=%s drive=%s super=%s', $this->formatInt($preview->damage), $this->formatInt($preview->drive), $this->formatInt($preview->super)));

            if (null !== $preview->position) {
                $output->writeln(sprintf(' position: %s', $preview->position));
            }

            if (null !== $preview->difficulty) {
                $output->writeln(sprintf(' difficulty: %s', $preview->difficulty));
            }

            if (null !== $preview->notes) {
                $output->writeln(sprintf(' notes: %s', $preview->notes));
            }

            if ([] !== $preview->warnings) {
                $output->writeln(sprintf(' warnings: %d', count($preview->warnings)));
                if ($output->isVerbose()) {
                    foreach ($preview->warnings as $warning) {
                        $output->writeln(sprintf('  - %s', $warning));
                    }
                }
            }
        }
    }

    private function formatInt(?int $value): string
    {
        return null === $value ? '-' : (string) $value;
    }
}
