export const REPORT_BUNDLE_FORMAT = "report_bundle_v1";

export type ReportBundleStatus = "ok" | "invalid" | "conflict";
export type ReportBundleScenarioAction = "create" | "update" | "unchanged" | "conflict";

export interface ReportBundleResult {
    status: ReportBundleStatus;
    dryRun: boolean;
    imported: boolean;
    report?: string;
    errors: string[];
    combos?: {created: number; existing: number; approvedExisting: number};
    scenarios?: Array<{name: string; action: ReportBundleScenarioAction}>;
    resourceGrids?: number;
}
