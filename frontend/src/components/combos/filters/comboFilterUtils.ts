import {DEFAULT_COMBO_FILTER_SORT} from "./comboFilterConstants";
import type {ComboCharacterOption, ComboFilterState, ComboMoveSearchOption, ComboSearchFilters} from "./comboFilterTypes";

export function parseOptionalNumber(value: string): number | undefined {
    const normalized = value.trim();
    if (normalized === "") {
        return undefined;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

export function normalizeCharacterOptions(value: unknown): ComboCharacterOption[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((character): character is ComboCharacterOption => {
            if (!character || typeof character !== "object" || Array.isArray(character)) {
                return false;
            }

            const record = character as Record<string, unknown>;
            return typeof record.id === "string" && typeof record.name === "string";
        })
        .sort((left, right) => left.name.localeCompare(right.name));
}

export function normalizeComboMoveSearchResults(value: unknown): ComboMoveSearchOption[] {
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
            } satisfies ComboMoveSearchOption;
        })
        .filter((entry): entry is ComboMoveSearchOption => entry !== null);
}

export function filterComboMovesForCharacter(options: ComboMoveSearchOption[], characterName: string): ComboMoveSearchOption[] {
    const characterNamePrefix = `${characterName.toLowerCase()} `;
    return options.filter((entry) => entry.summary.toLowerCase().startsWith(characterNamePrefix));
}

export function buildComboSearchFilters(state: ComboFilterState): ComboSearchFilters {
    return {
        q: state.query.trim() || undefined,
        characterId: state.characterId || undefined,
        firstMoveId: state.firstMove?.id ?? undefined,
        minDifficulty: parseOptionalNumber(state.minDifficulty),
        maxDifficulty: parseOptionalNumber(state.maxDifficulty),
        minDamage: parseOptionalNumber(state.minDamage),
        maxDamage: parseOptionalNumber(state.maxDamage),
        isEssential: state.requirements.isEssential ? true : undefined,
        counterHitRequired: state.requirements.counterHitRequired ? true : undefined,
        punishCounterRequired: state.requirements.punishCounterRequired ? true : undefined,
        cornerRequired: state.requirements.cornerRequired ? true : undefined,
        airborneRequired: state.requirements.airborneRequired ? true : undefined,
        midScreenRequired: state.requirements.midScreenRequired ? true : undefined,
        notCrouchingRequired: state.requirements.notCrouchingRequired ? true : undefined,
        moveTypes: state.moveTypes.length > 0 ? state.moveTypes : undefined,
        sort: state.sort,
    };
}

export function countActiveComboFilters(state: ComboFilterState): number {
    const active = [
        state.query.trim() !== "",
        state.characterId !== "",
        state.firstMove !== null,
        state.minDifficulty.trim() !== "",
        state.maxDifficulty.trim() !== "",
        state.minDamage.trim() !== "",
        state.maxDamage.trim() !== "",
        state.requirements.isEssential,
        state.requirements.counterHitRequired,
        state.requirements.punishCounterRequired,
        state.requirements.cornerRequired,
        state.requirements.airborneRequired,
        state.requirements.midScreenRequired,
        state.requirements.notCrouchingRequired,
        state.moveTypes.length > 0,
        state.sort !== DEFAULT_COMBO_FILTER_SORT,
    ];

    return active.filter(Boolean).length;
}
