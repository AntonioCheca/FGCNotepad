import type {MoveOption} from "./scenarioEditorTypes";

export function normalizeMoveListResults(value: unknown): MoveOption[] {
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

            const summary = typeof record.summary === "string" ? record.summary : "";
            if (summary === "") {
                return null;
            }

            const characterName = summary.includes(" ") ? summary.split(" ")[0] : "";

            return {
                id: String(record.id),
                summary,
                characterId: characterName,
            } satisfies MoveOption;
        })
        .filter((option): option is MoveOption => option !== null);
}

export function filterMoveOptionsForCharacter(options: MoveOption[], characterName: string): MoveOption[] {
    const characterPrefix = `${characterName.toLowerCase()} `;
    return options.filter((option) => option.summary.toLowerCase().startsWith(characterPrefix));
}

export function buildTriggerMoveSummaryFromSpecificMove(result: unknown, fallbackSummary: string): string {
    if (!result || typeof result !== "object" || Array.isArray(result)) {
        return fallbackSummary;
    }

    const record = result as Record<string, unknown>;
    const notation = typeof record.numpad_notation === "string" ? record.numpad_notation : fallbackSummary;
    const character = typeof record.character === "string" ? record.character : "";
    return character ? `${character} ${notation}` : notation;
}
