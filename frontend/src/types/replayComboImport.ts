export interface ReplayComboImportSource {
    replay_id: string;
    source_sha256: string;
    extractor_schema_version: string;
    analysis_format: string;
    analyzer_name: string;
    analyzer_version: string;
}

export interface ReplayComboExportDocument {
    format: "combo_export_v1";
    source: ReplayComboImportSource;
    combos: unknown[];
}

export interface ReplayComboImportResultRow {
    id: string;
    status: "imported" | "skipped";
    comboId?: number;
    reason?: string;
}

export interface ReplayComboImportResponse {
    importedCount: number;
    skippedCount: number;
    results: ReplayComboImportResultRow[];
}
