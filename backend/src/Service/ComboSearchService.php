<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboSequences;
use App\Entity\Situation;
use App\Entity\User;
use App\Repository\ComboSequencesRepository;
use App\Repository\SituationRepository;
use App\Util\Enum\ComboExecutionMode;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ComboSearchService
{
    public function __construct(
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly SituationRepository $situationRepository,
        private readonly SituationComboMatcher $situationComboMatcher,
        private readonly ComboValueEstimator $comboValueEstimator,
    ) {
    }

    /**
     * The first $limit matches, for callers that read the plain list.
     *
     * @param array<string, mixed> $filters
     */
    public function search(array $filters, ?User $actor, ?int $situationId, int $limit): ComboSearchResult
    {
        $sequences = $this->comboSequencesRepository->searchNonLeafsByFilters($filters, $limit, $actor);
        [$sequences, $compatibility] = $this->postProcess($sequences, $filters, $situationId);

        return new ComboSearchResult($sequences, count($sequences), $compatibility);
    }

    /**
     * One page of matches plus the total, so the list can be paged.
     *
     * @param array<string, mixed> $filters
     */
    public function searchPage(array $filters, ?User $actor, ?int $situationId, int $page, int $pageSize): ComboSearchResult
    {
        $offset = (max(1, $page) - 1) * $pageSize;
        if (!$this->needsPostProcessing($filters, $situationId)) {
            return new ComboSearchResult(
                $this->comboSequencesRepository->searchNonLeafsByFilters($filters, $pageSize, $actor, $offset),
                $this->comboSequencesRepository->countNonLeafsByFilters($filters, $actor),
            );
        }

        // Situation matching and resource-aware ordering run in PHP, so they need every match before slicing a page.
        $sequences = $this->comboSequencesRepository->searchNonLeafsByFilters($filters, ComboSequencesRepository::MAX_SEARCH_RESULTS, $actor);
        [$sequences, $compatibility] = $this->postProcess($sequences, $filters, $situationId);

        return new ComboSearchResult(array_slice($sequences, $offset, $pageSize), count($sequences), $compatibility);
    }

    /**
     * @param array<string, mixed> $filters
     */
    private function needsPostProcessing(array $filters, ?int $situationId): bool
    {
        return null !== $situationId || $this->usesResourceAwareSort($filters);
    }

    /**
     * @param array<string, mixed> $filters
     */
    private function usesResourceAwareSort(array $filters): bool
    {
        return 'resourceAdjustedDamage' === ($filters['sort'] ?? null)
            && (null !== ($filters['availableDrive'] ?? null) || null !== ($filters['availableSuper'] ?? null) || [] !== ($filters['availableObjectStatuses'] ?? []));
    }

    /**
     * @param list<ComboSequences> $sequences
     * @param array<string, mixed> $filters
     *
     * @return array{0: list<ComboSequences>, 1: array<int, array<string, mixed>>}
     */
    private function postProcess(array $sequences, array $filters, ?int $situationId): array
    {
        $compatibility = [];
        if (null !== $situationId) {
            [$sequences, $compatibility] = $this->filterBySituation($sequences, $this->findSituation($situationId));
        }

        if ($this->usesResourceAwareSort($filters)) {
            $sequences = $this->sortByResourceAwareValue($sequences, $filters);
        }

        return [$sequences, $compatibility];
    }

    private function findSituation(int $situationId): Situation
    {
        $situation = $this->situationRepository->find($situationId);
        if (null === $situation) {
            throw new NotFoundHttpException(sprintf('Situation ID %d not found.', $situationId));
        }

        return $situation;
    }

    /**
     * @param list<ComboSequences> $sequences
     *
     * @return array{0: list<ComboSequences>, 1: array<int, array<string, mixed>>}
     */
    private function filterBySituation(array $sequences, Situation $situation): array
    {
        $compatible = [];
        $compatibility = [];
        foreach ($sequences as $sequence) {
            $result = $this->situationComboMatcher->evaluate($sequence, $situation);
            if (CompatibilityResult::INCOMPATIBLE === $result->getStatus()) {
                continue;
            }

            $comboId = $sequence->getId();
            if (null !== $comboId) {
                $compatibility[$comboId] = $result->toArray();
            }
            $compatible[] = $sequence;
        }

        return [$compatible, $compatibility];
    }

    /**
     * @param list<ComboSequences> $sequences
     * @param array<string, mixed> $filters
     *
     * @return list<ComboSequences>
     */
    private function sortByResourceAwareValue(array $sequences, array $filters): array
    {
        $executionMode = ($filters['executionMode'] ?? null) instanceof ComboExecutionMode ? $filters['executionMode'] : ComboExecutionMode::CLASSIC;
        $resourceContext = [
            'drive' => $filters['availableDrive'] ?? 6.0,
            'super' => $filters['availableSuper'] ?? 0.0,
            'objectStatuses' => $filters['availableObjectStatuses'] ?? [],
        ];
        $ascending = 'asc' === ($filters['sortDirection'] ?? null);

        $values = [];
        foreach ($sequences as $index => $sequence) {
            $values[$index] = $this->comboValueEstimator->estimateSequenceValue($sequence, $resourceContext, $executionMode);
        }

        $order = array_keys($sequences);
        usort($order, static function (int $left, int $right) use ($values, $sequences, $ascending): int {
            $leftValue = $values[$left];
            $rightValue = $values[$right];
            if ($leftValue === $rightValue) {
                return ($sequences[$left]->getId() ?? 0) <=> ($sequences[$right]->getId() ?? 0);
            }
            if (null === $leftValue) {
                return 1;
            }
            if (null === $rightValue) {
                return -1;
            }

            return $ascending ? $leftValue <=> $rightValue : $rightValue <=> $leftValue;
        });

        return array_map(static fn (int $index): ComboSequences => $sequences[$index], $order);
    }
}
