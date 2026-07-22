export type ComboSortMode = "resourceAdjustedDamage" | "created";
export type ComboMoveType = "drive" | "super" | "special" | "normal";

export interface ComboMoveSearchOption {
    id: string;
    summary: string;
}

export interface ComboCharacterOption {
    id: string;
    name: string;
}

export interface ComboRequirementFilters {
    isEssential: boolean;
    counterHitRequired: boolean;
    punishCounterRequired: boolean;
    cornerRequired: boolean;
    airborneRequired: boolean;
    midScreenRequired: boolean;
    notCrouchingRequired: boolean;
}

export type ComboRequirementFilterKey = keyof ComboRequirementFilters;

export interface ComboFilterState {
    query: string;
    characterId: string;
    firstMove: ComboMoveSearchOption | null;
    firstMoveQuery: string;
    minDifficulty: string;
    maxDifficulty: string;
    minDamage: string;
    maxDamage: string;
    requirements: ComboRequirementFilters;
    moveTypes: ComboMoveType[];
    sort: ComboSortMode;
    showAdvancedFilters: boolean;
}

export interface ComboSearchFilters {
    q?: string;
    characterId?: string;
    firstMoveId?: string;
    minDifficulty?: number;
    maxDifficulty?: number;
    minDamage?: number;
    maxDamage?: number;
    isEssential?: boolean;
    counterHitRequired?: boolean;
    punishCounterRequired?: boolean;
    cornerRequired?: boolean;
    airborneRequired?: boolean;
    midScreenRequired?: boolean;
    notCrouchingRequired?: boolean;
    moveTypes?: string[];
    sort?: ComboSortMode;
}

export interface ComboFiltersProps {
    onChange: (filters: ComboSearchFilters) => void;
}
