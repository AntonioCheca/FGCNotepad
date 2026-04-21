<?php declare(strict_types=1);

namespace App\Service\ComboImport;

use App\Entity\Character;
use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequenceType;
use App\Entity\ComboSequences;
use App\Entity\ConnectionType;
use App\Entity\Season;
use App\Entity\Step;
use App\Entity\Visibility;
use App\Repository\ComboSequenceTypeRepository;
use App\Repository\ComboSequencesRepository;
use App\Repository\ConnectionTypeRepository;
use App\Repository\SeasonRepository;
use App\Repository\VisibilityRepository;
use App\Service\ComboImport\Model\ResolvedImportedComboCandidate;
use Doctrine\ORM\EntityManagerInterface;

class ImportedComboPersistenceService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private ComboSequenceTypeRepository $comboSequenceTypeRepository,
        private VisibilityRepository $visibilityRepository,
        private SeasonRepository $seasonRepository,
        private ComboSequencesRepository $comboSequencesRepository,
        private ConnectionTypeRepository $connectionTypeRepository,
    ) {
    }

    /**
     * @param array<int, ResolvedImportedComboCandidate> $resolved
     */
    public function persistValidCombos(array $resolved, Character $character): int
    {
        $comboType = $this->comboSequenceTypeRepository->findOneBy(['name' => 'combo']);
        $visibility = $this->visibilityRepository->findOneBy(['name' => 'public']);
        $season = $this->seasonRepository->findOneBy([], ['start_date' => 'DESC']);

        if (!$comboType instanceof ComboSequenceType || !$visibility instanceof Visibility || !$season instanceof Season) {
            throw new \RuntimeException('Missing combo type, visibility, or season required to persist imports.');
        }

        $persisted = 0;
        foreach ($resolved as $item) {
            if (!$item->canPersist()) {
                continue;
            }

            if (!$this->hasMinimumRequiredStructure($item)) {
                continue;
            }

            $combo = new ComboSequences();
            $combo
                ->setName($this->buildName($character->getName(), $item->normalizedNotation ?? $item->candidate->comboTextRaw))
                ->setDescription($this->buildDescription($item))
                ->setType($comboType)
                ->setVisibility($visibility)
                ->addSeason($season);

            $this->entityManager->persist($combo);

            $damage = $this->toNullableInt($item->candidate->damageRaw);
            if (null !== $damage) {
                $metrics = new ComboMetrics();
                $metrics->setSequence($combo)->setDamage($damage);
                $this->entityManager->persist($metrics);
            }

            foreach ($item->steps as $stepData) {
                $child = $this->comboSequencesRepository->find($stepData['child_sequence_id']);
                if (!$child instanceof ComboSequences) {
                    continue;
                }

                $connectionType = null;
                if (null !== $stepData['connection_type_id']) {
                    $connectionType = $this->connectionTypeRepository->find($stepData['connection_type_id']);
                }

                if (!$connectionType instanceof ConnectionType) {
                    continue;
                }

                $step = new Step();
                $step
                    ->setParentSequence($combo)
                    ->setChildSequence($child)
                    ->setOrdinalInCombo((int) $stepData['ordinal_in_combo'])
                    ->setConnectionType($connectionType);

                $this->entityManager->persist($step);
            }

            $requirement = $this->buildRequirement($combo, $item);
            if (null !== $requirement) {
                $this->entityManager->persist($requirement);
            }

            $persisted++;
        }

        if ($persisted > 0) {
            $this->entityManager->flush();
        }

        return $persisted;
    }

    private function hasMinimumRequiredStructure(ResolvedImportedComboCandidate $item): bool
    {
        if ([] === $item->steps || [] !== $item->errors) {
            return false;
        }

        foreach ($item->steps as $step) {
            if (null === $step['connection_type_id']) {
                return false;
            }
        }

        return true;
    }

    private function buildName(string $characterName, string $notation): string
    {
        return sprintf('%s import: %s', $characterName, $notation);
    }

    private function buildDescription(ResolvedImportedComboCandidate $item): string
    {
        $parts = [
            sprintf('Imported from %s (%s:%d)', $item->candidate->source, $item->candidate->sourceFile, $item->candidate->lineNumber),
        ];

        if (null !== $item->candidate->section) {
            $parts[] = sprintf('Section: %s', $item->candidate->section);
        }

        if (null !== $item->candidate->notesRaw) {
            $parts[] = sprintf('Notes: %s', $item->candidate->notesRaw);
        }

        return implode(' | ', $parts);
    }

    private function toNullableInt(?string $value): ?int
    {
        if (null === $value || !preg_match('/^-?\d+$/', trim($value))) {
            return null;
        }

        return (int) $value;
    }

    private function buildRequirement(ComboSequences $combo, ResolvedImportedComboCandidate $item): ?ComboRequirement
    {
        $text = strtolower(implode(' ', array_filter([
            $item->candidate->section,
            $item->candidate->comboTextRaw,
            $item->candidate->notesRaw,
            $item->candidate->positionRaw,
        ])));

        $counter = str_contains($text, '(pc)') || str_contains($text, 'punish counter') || str_contains($text, 'pc ');
        $corner = str_contains($text, 'corner');
        $air = str_contains($text, '(air)') || str_contains($text, 'airborne');

        if (!$counter && !$corner && !$air) {
            return null;
        }

        $requirement = new ComboRequirement();
        $requirement
            ->setSequence($combo)
            ->setCounterHitRequired(false)
            ->setPunishCounterRequired($counter)
            ->setCornerRequired($corner)
            ->setAirborneRequired($air)
            ->setMidScreenRequired(false)
            ->setNotCrouchingRequired(false);

        return $requirement;
    }
}
