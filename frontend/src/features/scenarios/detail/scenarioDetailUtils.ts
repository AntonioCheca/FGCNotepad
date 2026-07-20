import type {MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import type {ScenarioDetail, ScenarioResolvedLinkedCell, ScenarioResourceContextPayload} from "@/hooks/useScenarios";
import type {ScenarioExecutionSelection} from "@/src/types/scenarioExecution";

export const DEFAULT_EXECUTION_SELECTION: ScenarioExecutionSelection = {
    mode: "standard",
    difficultyCap: null,
};

export const DEFAULT_CHARACTER_LIFE = 10000;

export const DEFAULT_SCENARIO_RESOURCES: ScenarioResourceContextPayload = {
    attacker: {
        health: 10000,
        drive: 6,
        super: 0,
    },
    defender: {
        health: 10000,
        drive: 6,
        super: 0,
    },
};

export type CharacterLifeOption = {id: string; name: string; life?: number | null};

export function formatLinkedFormula(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function linkedResolutionKey(cell: Pick<ScenarioResolvedLinkedCell, "row" | "column">): string {
    return `body::row_${cell.row + 1}::column_${cell.column + 1}`;
}

export function buildLinkedCellResolutionMap(cells: ScenarioResolvedLinkedCell[]): Record<string, MatrixLinkedCellResolution> {
    return cells.reduce<Record<string, MatrixLinkedCellResolution>>((acc, cell) => {
        acc[linkedResolutionKey(cell)] = {
            basePreValue: cell.basePreValue,
            linkedExpectedValue: cell.linkedExpectedValue,
            finalValue: cell.finalValue,
            displayFormula: `${formatLinkedFormula(cell.basePreValue)}+${formatLinkedFormula(cell.linkedExpectedValue)}`,
        };

        return acc;
    }, {});
}

export function getExecutionModeBadgeLabel(selection: ScenarioExecutionSelection): string {
    if (selection.mode === "my_knowledge") {
        return "Execution: My Knowledge";
    }

    if (selection.mode === "difficulty_cap") {
        return `Execution: Difficulty <= ${selection.difficultyCap ?? 3}`;
    }

    return "Execution: Standard";
}

export function resolveScenarioCharacterLife(
    scenario: ScenarioDetail | null,
    characterId: string | null | undefined,
    characterName: string | null | undefined,
    explicitLife: number | null | undefined,
    characterById: Map<string, CharacterLifeOption>,
    characterByName: Map<string, CharacterLifeOption>,
): number {
    if (typeof explicitLife === "number") {
        return explicitLife;
    }

    if (!scenario || !characterId) {
        return characterName
            ? characterByName.get(characterName.trim().toLowerCase())?.life ?? DEFAULT_CHARACTER_LIFE
            : DEFAULT_CHARACTER_LIFE;
    }

    return characterById.get(characterId)?.life
        ?? (characterName ? characterByName.get(characterName.trim().toLowerCase())?.life : undefined)
        ?? DEFAULT_CHARACTER_LIFE;
}
