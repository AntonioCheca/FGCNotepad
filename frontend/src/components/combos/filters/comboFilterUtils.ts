import type {RequirementObjectOption} from "@/src/types/combo";
import type {ComboBooleanFilterValue, ComboCharacterOption, ComboDriveWindowFilter, ComboFilterState, ComboMoveSearchOption, ComboSearchFilters} from "./comboFilterTypes";

export function parseOptionalNumber(value: string): number | undefined {
    const normalized = value.trim();
    if (normalized === "") {
        return undefined;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

function parseOptionalFloat(value: string): number | undefined {
    const normalized = value.trim();
    if (normalized === "") {
        return undefined;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function buildDriveWindowRange(filter: ComboDriveWindowFilter): {min?: number; max?: number} {
    if (!filter.enabled) {
        return {};
    }

    const min = parseOptionalFloat(filter.min);
    const max = parseOptionalFloat(filter.max);
    if (min === undefined || max === undefined) {
        return {min, max};
    }

    return min <= max ? {min, max} : {min: max, max: min};
}

function parseBooleanFilter(value: ComboBooleanFilterValue): boolean | undefined {
    if (value === "true") {
        return true;
    }

    if (value === "false") {
        return false;
    }

    return undefined;
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

export function normalizeRequirementObjectOptions(value: unknown): RequirementObjectOption[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((entry) => {
            if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
                return null;
            }

            const record = entry as {
                object_key?: unknown;
                name?: unknown;
                character_name?: unknown;
                display_name?: unknown;
                status_type?: unknown;
                max_status?: unknown;
                can_be_consumed?: unknown;
                can_be_added_relative?: unknown;
                can_be_added_absolute?: unknown;
            };
            if (typeof record.name !== "string" || (record.status_type !== "integer" && record.status_type !== "boolean")) {
                return null;
            }

            return {
                object_key: typeof record.object_key === "string" ? record.object_key : record.name,
                name: record.name,
                character_name: typeof record.character_name === "string" ? record.character_name : "",
                display_name: typeof record.display_name === "string" ? record.display_name : record.name,
                status_type: record.status_type,
                max_status: typeof record.max_status === "number" ? record.max_status : null,
                can_be_consumed: record.can_be_consumed === true,
                can_be_added_relative: record.can_be_added_relative === true,
                can_be_added_absolute: record.can_be_added_absolute === true,
            } satisfies RequirementObjectOption;
        })
        .filter((entry): entry is RequirementObjectOption => entry !== null)
        .sort((left, right) => left.display_name.localeCompare(right.display_name));
}

export function buildComboSearchFilters(state: ComboFilterState): ComboSearchFilters {
    const driveCostRange = buildDriveWindowRange(state.driveWindows.driveCost);
    const minimumDriveCostRange = buildDriveWindowRange(state.driveWindows.minimumDriveCost);
    const minimumDriveCostNoBurnoutRange = buildDriveWindowRange(state.driveWindows.minimumDriveCostNoBurnout);

    return {
        q: state.query.trim() || undefined,
        characterId: state.characterId || undefined,
        firstMoveId: state.firstMove?.id ?? undefined,
        enderMoveId: state.enderMove?.id ?? undefined,
        minDifficulty: parseOptionalNumber(state.minDifficulty),
        maxDifficulty: parseOptionalNumber(state.maxDifficulty),
        minDamage: parseOptionalNumber(state.minDamage),
        maxDamage: parseOptionalNumber(state.maxDamage),
        minDriveCost: driveCostRange.min,
        maxDriveCost: driveCostRange.max,
        minMinimumDriveCost: minimumDriveCostRange.min,
        maxMinimumDriveCost: minimumDriveCostRange.max,
        minMinimumDriveCostNoBurnout: minimumDriveCostNoBurnoutRange.min,
        maxMinimumDriveCostNoBurnout: minimumDriveCostNoBurnoutRange.max,
        isEssential: parseBooleanFilter(state.requirements.isEssential),
        counterHitRequired: parseBooleanFilter(state.requirements.counterHitRequired),
        punishCounterRequired: parseBooleanFilter(state.requirements.punishCounterRequired),
        cornerRequired: parseBooleanFilter(state.requirements.cornerRequired),
        airborneRequired: parseBooleanFilter(state.requirements.airborneRequired),
        notCrouchingRequired: parseBooleanFilter(state.requirements.notCrouchingRequired),
        sideSwitchesRequired: parseBooleanFilter(state.requirements.sideSwitchesRequired),
        requirementObjectName: state.requirements.requirementObjectName || undefined,
        requirementObjectStatus: state.requirements.requirementObjectStatus || undefined,
        addedObjectName: state.requirements.addedObjectName || undefined,
        addedObjectStatus: state.requirements.addedObjectStatus || undefined,
        consumedObjectName: state.requirements.consumedObjectName || undefined,
        sort: state.sort,
        sortDirection: state.sortDirection,
    };
}
