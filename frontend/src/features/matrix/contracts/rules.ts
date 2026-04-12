export enum SummaryAxisRole {
    OpponentExpectedUsage = "opponent_expected_usage",
    PlayerOptimalUsage = "player_optimal_usage",
}

export enum SummaryAxisMutability {
    Editable = "editable",
    DerivedReadonly = "derived_readonly",
}

export const SUMMARY_AXIS_LIMITS = {
    min: 0,
    max: 1,
} as const;

export const SUMMARY_AXIS_DEFAULTS = {
    allowNull: true,
    roundExpectedValueTo: 4,
} as const;

export const SUMMARY_AXIS_FIELD_KEYS = {
    rowAxis: "rowSummaryCells",
    columnAxis: "columnSummaryCells",
    expectedValue: "expectedValueCell",
} as const;

export const MATRIX_EDITOR_NON_GOALS = [
    "general_spreadsheet",
    "formula_language",
    "merged_cells",
    "cell_styling_engine",
    "mobile_first_editor",
    "large_grid_primary_target",
] as const;

export type MatrixEditorNonGoal = (typeof MATRIX_EDITOR_NON_GOALS)[number];
