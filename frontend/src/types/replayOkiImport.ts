import {ReplayComboImportDocumentResult} from "@/src/types/replayComboImport";

export interface ReplayOkiImportResultRow {
    id: string;
    status: "imported" | "observed" | "skipped";
    profileId?: number;
    setupId?: number;
    reason?: string;
}

export interface ReplayOkiImportDocumentResult extends Omit<ReplayComboImportDocumentResult, "results"> {
    results: ReplayOkiImportResultRow[];
}

export interface ReplayOkiImportResponse extends ReplayOkiImportDocumentResult {
    documents?: ReplayOkiImportDocumentResult[];
}
