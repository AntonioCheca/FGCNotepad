export type ComboSortField = "damage" | "resourceAdjustedDamage" | "driveCost" | "minimumDriveCost" | "minimumDriveCostNoBurnout" | "superCost" | "driveGain" | "superGain" | "seasonStartDate";
export type ComboSortDirection = "asc" | "desc";
export type ComboDriveWindowMetric = "driveCost" | "minimumDriveCost" | "minimumDriveCostNoBurnout";
export type ComboBooleanFilterValue = "" | "true" | "false";

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

export interface ComboSituationOption {
    id: number;
    name: string;
    typeName: string;
    typeCode: string;
}

export interface ComboRequirementFilters {
    isEssential: ComboBooleanFilterValue;
    counterHitRequired: ComboBooleanFilterValue;
    punishCounterRequired: ComboBooleanFilterValue;
    cornerRequired: ComboBooleanFilterValue;
    airborneRequired: ComboBooleanFilterValue;
    notCrouchingRequired: ComboBooleanFilterValue;
    sideSwitchesRequired: ComboBooleanFilterValue;
    requirementObjectName: string;
    requirementObjectStatus: string;
    addedObjectName: string;
    addedObjectStatus: string;
    consumedObjectName: string;
}

export type ComboRequirementFilterKey = Exclude<keyof ComboRequirementFilters, "requirementObjectName" | "requirementObjectStatus" | "addedObjectName" | "addedObjectStatus" | "consumedObjectName">;

export interface ComboFilterState {
    query: string;
    characterId: string;
    situation: ComboSituationOption | null;
    firstMove: ComboMoveSearchOption | null;
    firstMoveQuery: string;
    enderMove: ComboMoveSearchOption | null;
    enderMoveQuery: string;
    minDifficulty: string;
    maxDifficulty: string;
    minDamage: string;
    maxDamage: string;
    spacingCodes: string[];
    driveWindows: ComboDriveWindowFilters;
    requirements: ComboRequirementFilters;
    sort: ComboSortField;
    sortDirection: ComboSortDirection;
    showAdvancedFilters: boolean;
}

export interface ComboSearchFilters {
    q?: string;
    characterId?: string;
    situationId?: number;
    firstMoveId?: string;
    enderMoveId?: string;
    minDifficulty?: number;
    maxDifficulty?: number;
    minDamage?: number;
    maxDamage?: number;
    spacingCodes?: string[];
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
    notCrouchingRequired?: boolean;
    sideSwitchesRequired?: boolean;
    requirementObjectName?: string;
    requirementObjectStatus?: string;
    addedObjectName?: string;
    addedObjectStatus?: string;
    consumedObjectName?: string;
    sort?: ComboSortField;
    sortDirection?: ComboSortDirection;
}

export interface ComboFiltersProps {
    onChange: (filters: ComboSearchFilters) => void;
}
