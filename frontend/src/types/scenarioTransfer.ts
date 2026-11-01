export const SCENARIO_EXPORT_FORMAT = "scenario_export_v1";

export type ScenarioImportStatus = "ok" | "invalid" | "unresolved_starters" | "conflict";
export type ScenarioImportAction = "create" | "update" | "unchanged" | "conflict";

export interface ScenarioExportKey {
    source: string;
    externalId: string;
}

export interface ScenarioImportResourceLevel {
    label: string;
    value: number | null;
    comboId: number | null;
    starterMoveOnly: boolean;
}

export interface ScenarioImportDynamicCell {
    path: string;
    row: string;
    column: string;
    initiator: "attacker" | "defender";
    character: string;
    moves: string[];
    hitCondition: string;
    resolved: boolean;
    combo: {id: number; name: string | null} | null;
    value: number | null;
    levels: ScenarioImportResourceLevel[];
}

export interface ScenarioImportReportScenario {
    key: ScenarioExportKey;
    name: string;
    action: ScenarioImportAction;
    conflict?: string | null;
    id: string | null;
    url?: string;
    moderationState?: string;
    unresolvedStarters?: string[];
    dynamicCells?: ScenarioImportDynamicCell[];
}

export interface ScenarioImportReport {
    format: typeof SCENARIO_EXPORT_FORMAT;
    status: ScenarioImportStatus;
    errors: string[];
    scenarios: ScenarioImportReportScenario[];
    imported?: boolean;
    error?: string;
}

export interface ScenarioExportDocument {
    format: typeof SCENARIO_EXPORT_FORMAT;
    exportedAt: string;
    scenarios: Array<{key: ScenarioExportKey; name: string} & Record<string, unknown>>;
}
