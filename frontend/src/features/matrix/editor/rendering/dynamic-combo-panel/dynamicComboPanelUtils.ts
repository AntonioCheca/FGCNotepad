import type {MatrixDynamicComboData} from "@/src/features/matrix/model";
import type {DynamicComboMoveOption, StarterContextPreset} from "./dynamicComboPanelTypes";

export function contextFromPreset(preset: StarterContextPreset): MatrixDynamicComboData["starterContext"] {
    if (preset === "punish_counter") {
        return {isPunishCounter: true, isCounterHit: false};
    }

    if (preset === "counter_hit") {
        return {isPunishCounter: false, isCounterHit: true};
    }

    return {isPunishCounter: false, isCounterHit: false};
}

export function presetFromContext(value: MatrixDynamicComboData["starterContext"] | null | undefined): StarterContextPreset {
    if (value?.isPunishCounter) {
        return "punish_counter";
    }

    if (value?.isCounterHit) {
        return "counter_hit";
    }

    return "normal";
}

export function normalizeMoveSearchResults(value: unknown): DynamicComboMoveOption[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) {
                return null;
            }

            const record = item as Record<string, unknown>;
            if (typeof record.id !== "string" && typeof record.id !== "number") {
                return null;
            }

            return {
                id: String(record.id),
                summary: typeof record.summary === "string" ? record.summary : `Move #${String(record.id)}`,
            } satisfies DynamicComboMoveOption;
        })
        .filter((option): option is DynamicComboMoveOption => option !== null);
}

export function createStarterSelections(initialValue: MatrixDynamicComboData | null, moveLabelById: Record<string, string>): DynamicComboMoveOption[] {
    return (initialValue?.starterMoveIds ?? []).map((starterMoveId) => ({
        id: starterMoveId,
        summary: moveLabelById[starterMoveId] ?? `Move #${starterMoveId}`,
    }));
}

export function buildResolvedMoveLabel(moveId: string, move: unknown): string {
    if (!move || typeof move !== "object" || Array.isArray(move)) {
        return `Move #${moveId}`;
    }

    const record = move as Record<string, unknown>;
    const notation = typeof record.numpad_notation === "string" ? record.numpad_notation : null;
    const character = typeof record.character === "string" ? record.character : null;

    return notation ? `${character ? `${character} ` : ""}${notation}` : `Move #${moveId}`;
}

export function buildStarterLabels(starterSelections: DynamicComboMoveOption[]): Record<string, string> {
    return starterSelections.reduce<Record<string, string>>((acc, selection) => {
        acc[selection.id] = selection.summary;
        return acc;
    }, {});
}
