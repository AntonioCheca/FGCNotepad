<?php declare(strict_types=1);

namespace App\Service\ScenarioTransfer;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\ScenarioComboContext;
use App\Repository\ComboSequencesRepository;
use App\Service\CharacterResourceService;
use App\Service\ResolveDynamicComboCellService;
use App\Service\ScenarioExecutionModeService;

/**
 * Checks that every dynamic combo starter of an import resolves to a stored combo, and shows how its value moves
 * with resources. A starter that only falls back to the starter move's own damage counts as unresolved.
 *
 * @phpstan-import-type ResolvedScenario from ScenarioImportResolver
 */
final class ScenarioImportStarterCheckService
{
    private const RESOURCE_LEVELS = [
        ['label' => '0 Drive, 0 Super', 'drive' => 0.0, 'super' => 0.0],
        ['label' => '3 Drive, 1 Super', 'drive' => 3.0, 'super' => 1.0],
        ['label' => '6 Drive, 3 Super', 'drive' => 6.0, 'super' => 3.0],
    ];

    public function __construct(
        private readonly ResolveDynamicComboCellService $resolveDynamicComboCellService,
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly CharacterResourceService $characterResourceService,
    ) {
    }

    /**
     * @param ResolvedScenario $scenario
     *
     * @return list<array<string, mixed>>
     */
    public function check(array $scenario): array
    {
        $comboContext = $this->comboContext($scenario);
        $cellsByPath = [];
        foreach ($scenario['parsed']['cells'] as $rowCells) {
            foreach ($rowCells as $cell) {
                $cellsByPath[$cell['path']] = $cell;
            }
        }

        $report = [];
        foreach ($scenario['starters'] as $cellPath => $starter) {
            $characterId = (string) $starter['character']->getId();
            $moveIds = array_map(static fn (Move $move): string => (string) $move->getId(), $starter['moves']);
            $unconstrained = $this->resolveDynamicComboCellService->resolve($characterId, $moveIds, $starter['hitCondition'], null, ScenarioExecutionModeService::MODE_STANDARD, null, null, $comboContext);

            $levels = [];
            foreach ($this->resourceLevels($starter['character']) as $level) {
                $resolution = $this->resolveDynamicComboCellService->resolve($characterId, $moveIds, $starter['hitCondition'], null, ScenarioExecutionModeService::MODE_STANDARD, null, $level['resources'], $comboContext);
                $levels[] = [
                    'label' => $level['label'],
                    'value' => $resolution['resolvedDamage'],
                    'comboId' => $resolution['resolvedComboId'],
                    'starterMoveOnly' => null === $resolution['resolvedComboId'],
                ];
            }

            $comboId = $unconstrained['resolvedComboId'];
            $report[] = [
                'path' => $starter['path'],
                'row' => $cellsByPath[$cellPath]['row'],
                'column' => $cellsByPath[$cellPath]['column'],
                'initiator' => $starter['initiator'],
                'character' => $starter['character']->getName(),
                'moves' => array_map(static fn (Move $move): string => $move->getNumpadNotation(), $starter['moves']),
                'hitCondition' => $starter['hitCondition'],
                'resolved' => null !== $comboId,
                'combo' => null !== $comboId ? ['id' => $comboId, 'name' => $this->comboSequencesRepository->find($comboId)?->getName()] : null,
                'value' => null !== $comboId ? $unconstrained['resolvedDamage'] : null,
                'levels' => $levels,
            ];
        }

        return $report;
    }

    /**
     * Same effective context ScenarioComboContextService builds for a stored scenario without viewer overrides.
     *
     * @param ResolvedScenario $scenario
     *
     * @return array{allowedPositions:list<string>,characterStatuses:array<string,string>}
     */
    private function comboContext(array $scenario): array
    {
        $characterStatuses = [];
        foreach ($scenario['characterStatuses'] as $status) {
            $characterStatuses[$status['object_name']] = $status['status_required'];
        }

        return [
            'allowedPositions' => ScenarioComboContext::POSITION_CORNER === $scenario['parsed']['situation']['position'] ? ['corner'] : ['midscreen'],
            'characterStatuses' => $characterStatuses,
        ];
    }

    /**
     * @return list<array{label:string,resources:array{health:float,drive:float,super:float,objectStatuses:array<string,string>}}>
     */
    private function resourceLevels(Character $character): array
    {
        $levels = array_map(
            static fn (array $level): array => [
                'label' => $level['label'],
                'resources' => ['health' => 10000.0, 'drive' => $level['drive'], 'super' => $level['super'], 'objectStatuses' => []],
            ],
            self::RESOURCE_LEVELS
        );

        $fullObjects = [];
        foreach ($this->characterResourceService->listForApi($character->getName()) as $definition) {
            $fullValue = 'integer' === $definition['status_type'] ? $definition['max_status'] : 'true';
            if (null !== $fullValue) {
                $fullObjects[(string) $definition['name']] = (string) $fullValue;
            }
        }

        if ([] !== $fullObjects) {
            $last = $levels[count($levels) - 1];
            $levels[] = [
                'label' => sprintf('%s, %s', $last['label'], implode(', ', array_map(static fn (string $name, string $value): string => sprintf('%s %s', $name, $value), array_keys($fullObjects), $fullObjects))),
                'resources' => array_merge($last['resources'], ['objectStatuses' => $fullObjects]),
            ];
        }

        return $levels;
    }
}
