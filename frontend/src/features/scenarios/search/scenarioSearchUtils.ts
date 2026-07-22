import type {ScenarioCharacterOption, ScenarioSearchDraft, ScenarioSearchFilterState, ScenarioTriggerMoveOption} from "./scenarioSearchTypes";

export function normalizeScenarioCharacterOptions(value: unknown): ScenarioCharacterOption[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((character): character is ScenarioCharacterOption => {
            if (!character || typeof character !== "object" || Array.isArray(character)) {
                return false;
            }

            const record = character as Record<string, unknown>;
            return typeof record.id === "string" && typeof record.name === "string";
        })
        .sort((left, right) => left.name.localeCompare(right.name));
}

export function normalizeScenarioMoveSearchResults(value: unknown): ScenarioTriggerMoveOption[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((entry) => {
            if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
                return null;
            }

            const record = entry as {id?: unknown; summary?: unknown};
            if (typeof record.id !== "string" || typeof record.summary !== "string") {
                return null;
            }

            return {
                id: record.id,
                summary: record.summary,
            } satisfies ScenarioTriggerMoveOption;
        })
        .filter((entry): entry is ScenarioTriggerMoveOption => entry !== null);
}

export function filterScenarioMovesForAttacker(options: ScenarioTriggerMoveOption[], attackerName: string): ScenarioTriggerMoveOption[] {
    const attackerNamePrefix = `${attackerName.toLowerCase()} `;
    return options.filter((entry) => entry.summary.toLowerCase().startsWith(attackerNamePrefix));
}

export function buildScenarioSearchDraft(state: ScenarioSearchFilterState): ScenarioSearchDraft {
    return {
        q: state.query.trim() || undefined,
        scenarioType: state.scenarioType || undefined,
        defenderCharacterId: state.defenderCharacterId || undefined,
        attackerCharacterId: state.attackerCharacterId || undefined,
        triggerMoveId: state.triggerMoveSelection?.id ?? undefined,
    };
}

export function countActiveScenarioFilters(filters: ScenarioSearchDraft): number {
    return [
        Boolean(filters.q),
        Boolean(filters.scenarioType),
        Boolean(filters.defenderCharacterId),
        Boolean(filters.attackerCharacterId),
        Boolean(filters.triggerMoveId),
    ].filter(Boolean).length;
}
