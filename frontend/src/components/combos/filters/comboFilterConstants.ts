import type {ComboDriveWindowFilters, ComboFilterState, ComboRequirementFilters, ComboSortField} from "./comboFilterTypes";

export const DEFAULT_COMBO_FILTER_SORT: ComboSortField = "resourceAdjustedDamage";

export const DEFAULT_COMBO_REQUIREMENTS: ComboRequirementFilters = {
    isEssential: "",
    counterHitRequired: "",
    punishCounterRequired: "",
    perfectParryRequired: "",
    cornerRequired: "",
    airborneRequired: "",
    notCrouchingRequired: "",
    sideSwitchesRequired: "",
    requirementObjectName: "",
    requirementObjectStatus: "",
    addedObjectName: "",
    addedObjectStatus: "",
    consumedObjectName: "",
};

export const DEFAULT_COMBO_DRIVE_WINDOWS: ComboDriveWindowFilters = {
    driveCost: {enabled: false, min: "", max: ""},
    minimumDriveCost: {enabled: false, min: "", max: ""},
    minimumDriveCostNoBurnout: {enabled: false, min: "", max: ""},
};

export const DEFAULT_COMBO_FILTER_STATE: ComboFilterState = {
    query: "",
    characterId: "",
    situation: null,
    firstMove: null,
    firstMoveQuery: "",
    firstMoveAfterDriveRush: false,
    enderMove: null,
    enderMoveQuery: "",
    minDifficulty: "",
    maxDifficulty: "",
    minDamage: "",
    maxDamage: "",
    availableDrive: "",
    availableSuper: "",
    spacingCodes: [],
    driveWindows: DEFAULT_COMBO_DRIVE_WINDOWS,
    requirements: DEFAULT_COMBO_REQUIREMENTS,
    sort: DEFAULT_COMBO_FILTER_SORT,
    sortDirection: "desc",
    showAdvancedFilters: false,
};
