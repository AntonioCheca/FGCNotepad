import type {ComboFilterState, ComboMoveType, ComboRequirementFilters, ComboSortField} from "./comboFilterTypes";

export const DEFAULT_COMBO_FILTER_SORT: ComboSortField = "resourceAdjustedDamage";

export const MOVE_TYPE_VALUES: ComboMoveType[] = ["drive", "super", "special", "normal"];

export const MOVE_TYPE_LABELS: Record<ComboMoveType, string> = {
    drive: "Drive",
    super: "Super",
    special: "Special",
    normal: "Normal",
};

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
    requirements: DEFAULT_COMBO_REQUIREMENTS,
    moveTypes: [],
    sort: DEFAULT_COMBO_FILTER_SORT,
    sortDirection: "desc",
    showAdvancedFilters: false,
};
