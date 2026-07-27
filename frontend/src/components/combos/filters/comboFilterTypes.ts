export type ComboSortField = "damage" | "resourceAdjustedDamage" | "driveCost" | "minimumDriveCost" | "minimumDriveCostNoBurnout" | "superCost" | "driveGain" | "superGain" | "seasonStartDate";
export type ComboSortDirection = "asc" | "desc";
export type ComboDriveWindowMetric = "driveCost" | "minimumDriveCost" | "minimumDriveCostNoBurnout";

export interface ComboDriveWindowFilter {
    enabled: boolean;
    min: string;
    max: string;
}

export type ComboDriveWindowFilters = Record<ComboDriveWindowMetric, ComboDriveWindowFilter>;

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
    requirementObjectName: string;
    requirementObjectStatus: string;
}

export type ComboRequirementFilterKey = Exclude<keyof ComboRequirementFilters, "requirementObjectName" | "requirementObjectStatus">;

export interface ComboFilterState {
    query: string;
    characterId: string;
    firstMove: ComboMoveSearchOption | null;
    firstMoveQuery: string;
    enderMove: ComboMoveSearchOption | null;
    enderMoveQuery: string;
    minDifficulty: string;
    maxDifficulty: string;
    minDamage: string;
    maxDamage: string;
    driveWindows: ComboDriveWindowFilters;
    requirements: ComboRequirementFilters;
    sort: ComboSortField;
    sortDirection: ComboSortDirection;
    showAdvancedFilters: boolean;
}

export interface ComboSearchFilters {
    q?: string;
    characterId?: string;
    firstMoveId?: string;
    enderMoveId?: string;
    minDifficulty?: number;
    maxDifficulty?: number;
    minDamage?: number;
    maxDamage?: number;
    minDriveCost?: number;
    maxDriveCost?: number;
    minMinimumDriveCost?: number;
    maxMinimumDriveCost?: number;
    minMinimumDriveCostNoBurnout?: number;
    maxMinimumDriveCostNoBurnout?: number;
    isEssential?: boolean;
    counterHitRequired?: boolean;
    punishCounterRequired?: boolean;
    cornerRequired?: boolean;
    airborneRequired?: boolean;
    midScreenRequired?: boolean;
    notCrouchingRequired?: boolean;
    requirementObjectName?: string;
    requirementObjectStatus?: string;
    sort?: ComboSortField;
    sortDirection?: ComboSortDirection;
}

export interface ComboFiltersProps {
    onChange: (filters: ComboSearchFilters) => void;
}
