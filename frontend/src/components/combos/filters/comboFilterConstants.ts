import type {ComboFilterState, ComboRequirementFilters, ComboSortField} from "./comboFilterTypes";

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
    sort: DEFAULT_COMBO_FILTER_SORT,
    sortDirection: "desc",
    showAdvancedFilters: false,
};
