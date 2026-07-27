import type {ComboDriveWindowFilters, ComboFilterState, ComboRequirementFilters, ComboSortField} from "./comboFilterTypes";

export const DEFAULT_COMBO_FILTER_SORT: ComboSortField = "resourceAdjustedDamage";

export const DEFAULT_COMBO_REQUIREMENTS: ComboRequirementFilters = {
    isEssential: false,
    counterHitRequired: false,
    punishCounterRequired: false,
    cornerRequired: false,
    airborneRequired: false,
    midScreenRequired: false,
    notCrouchingRequired: false,
    requirementObjectName: "",
    requirementObjectStatus: "",
};

export const DEFAULT_COMBO_DRIVE_WINDOWS: ComboDriveWindowFilters = {
    driveCost: {enabled: false, min: "", max: ""},
    minimumDriveCost: {enabled: false, min: "", max: ""},
    minimumDriveCostNoBurnout: {enabled: false, min: "", max: ""},
};

export const DEFAULT_COMBO_FILTER_STATE: ComboFilterState = {
    query: "",
    characterId: "",
    firstMove: null,
    firstMoveQuery: "",
    enderMove: null,
    enderMoveQuery: "",
    minDifficulty: "",
    maxDifficulty: "",
    minDamage: "",
    maxDamage: "",
    driveWindows: DEFAULT_COMBO_DRIVE_WINDOWS,
    requirements: DEFAULT_COMBO_REQUIREMENTS,
    sort: DEFAULT_COMBO_FILTER_SORT,
    sortDirection: "desc",
    showAdvancedFilters: false,
};
