import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

export interface ImportRow {
    id: string;
    status: "imported" | "observed" | "skipped";
    reason?: string;
    warnings?: string[];
    comboId?: number;
    profileId?: number;
    setupId?: number;
}

export interface ImportDocumentResult {
    replayId?: string;
    importedCount: number;
    observedCount?: number;
    skippedCount: number;
    replay?: {metadataAvailable: boolean; uploadedAt: string | null};
    results: ImportRow[];
    error?: string;
    documents?: ImportDocumentResult[];
}

interface FileImportResult {
    fileName: string;
    response?: ImportDocumentResult;
    error?: string;
}

interface ReplayImportSectionProps {
    title: string;
    singleFormat: string;
    bundleFormat: string;
    submitLabel: string;
    importedLabel: (row: ImportRow) => string;
    importDocument: (document: unknown) => Promise<ImportDocumentResult>;
    onFinished: () => void;
}

function normalizeApiError(error: unknown, fallbackMessage: string): string {
    if (typeof error !== "object" || error === null) {
        return fallbackMessage;
    }

    const responseError = error as {response?: {data?: {error?: string}}; message?: string};

    return responseError.response?.data?.error || responseError.message || fallbackMessage;
}

function hasFormat(value: unknown, formats: string[]): boolean {
    return typeof value === "object" && value !== null && formats.includes((value as {format?: unknown}).format as string);
}

function ImportResults({results, importedLabel}: {results: FileImportResult[]; importedLabel: (row: ImportRow) => string}) {
    const importedCount = results.reduce((total, entry) => total + (entry.response?.importedCount ?? 0), 0);
    const observedCount = results.reduce((total, entry) => total + (entry.response?.observedCount ?? 0), 0);
    const skippedCount = results.reduce((total, entry) => total + (entry.response?.skippedCount ?? 0), 0);
    const failedFileCount = results.filter((entry) => entry.error !== undefined).length;

    return (
        <AppBox sx={{display: "grid", gap: 0.75}}>
            <AppBox sx={{display: "flex", gap: 0.75, flexWrap: "wrap"}}>
                <AppTypography variant="body2" sx={{fontWeight: 650}}>Imported: {importedCount}</AppTypography>
                <AppTypography variant="body2" color="text.secondary">Already known: {observedCount}</AppTypography>
                <AppTypography variant="body2" color="text.secondary">Skipped: {skippedCount}</AppTypography>
                {failedFileCount > 0 ? <AppTypography variant="body2" color="error.main">Failed files: {failedFileCount}</AppTypography> : null}
            </AppBox>
            {results.map((entry) => (
                <AppBox key={entry.fileName} sx={{display: "grid", gap: 0.75}}>
                    <AppTypography variant="body2" sx={{fontWeight: 650, overflowWrap: "anywhere"}}>{entry.fileName}</AppTypography>
                    {entry.response?.replay ? (
                        <AppTypography variant="caption" color="text.secondary">
                            {entry.response.replay.metadataAvailable ? `Replay metadata stored${entry.response.replay.uploadedAt ? `, uploaded ${entry.response.replay.uploadedAt.slice(0, 10)}` : ""}.` : "No replay metadata in this export."}
                        </AppTypography>
                    ) : null}
                    {entry.error !== undefined ? (
                        <AppTypography variant="caption" color="error.main" sx={{overflowWrap: "anywhere"}}>{entry.error}</AppTypography>
                    ) : null}
                    {(entry.response?.results ?? []).map((row) => (
                        <AppBox
                            key={row.id}
                            sx={{display: "grid", gap: 0.2, p: 0.9, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1, backgroundColor: "fgc.surface.subtle"}}
                        >
                            <AppTypography variant="body2" sx={{fontWeight: 650, overflowWrap: "anywhere"}}>{row.id}</AppTypography>
                            {row.status === "imported" ? (
                                <AppTypography variant="caption" color="success.main">{importedLabel(row)}</AppTypography>
                            ) : row.status === "observed" ? (
                                <AppTypography variant="caption" color="text.secondary">Already known; replay observation added ({importedLabel(row).replace(/^Created /, "").replace(/\.$/, "")}).</AppTypography>
                            ) : (
                                <AppTypography variant="caption" color="error.main" sx={{overflowWrap: "anywhere"}}>{row.reason}</AppTypography>
                            )}
                            {(row.warnings ?? []).map((warning) => (
                                <AppTypography key={warning} variant="caption" color="warning.main" sx={{overflowWrap: "anywhere"}}>{warning}</AppTypography>
                            ))}
                        </AppBox>
                    ))}
                </AppBox>
            ))}
        </AppBox>
    );
}

export function ReplayImportSection({title, singleFormat, bundleFormat, submitLabel, importedLabel, importDocument, onFinished}: ReplayImportSectionProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [files, setFiles] = React.useState<File[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<FileImportResult[] | null>(null);

    const handleImport = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        setResult(null);

        const fileResults: FileImportResult[] = [];
        for (const file of files) {
            try {
                const parsed: unknown = JSON.parse(await file.text());
                if (!hasFormat(parsed, [singleFormat, bundleFormat])) {
                    throw new Error(`Not a ${singleFormat} or ${bundleFormat} JSON document.`);
                }

                const response = await importDocument(parsed);
                if (response.documents) {
                    response.documents.forEach((documentResult) => {
                        fileResults.push({
                            fileName: `${file.name} / ${documentResult.replayId ?? "unknown replay"}`,
                            response: documentResult,
                            error: documentResult.error,
                        });
                    });
                } else {
                    fileResults.push({fileName: file.name, response});
                }
            } catch (importError: unknown) {
                fileResults.push({fileName: file.name, error: normalizeApiError(importError, "Unable to import replay data.")});
            }
            setResult([...fileResults]);
        }

        setLoading(false);
        onFinished();
    };

    return (
        <SectionCard title={title} variant="input" tone="raised">
            <AppBox sx={{display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25, minWidth: 0}}>
                <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    multiple
                    accept="application/json,.json"
                    aria-label={`${singleFormat} or ${bundleFormat} JSON files`}
                    onChange={(event) => {
                        setFiles(Array.from(event.target.files ?? []));
                        setError(null);
                        setResult(null);
                        event.target.value = "";
                    }}
                />
                <AppButton type="button" variant="outlined" color="secondary" onClick={() => fileInputRef.current?.click()} sx={{flexShrink: 0, minHeight: 40}}>
                    Choose files
                </AppButton>
                <AppTypography
                    variant="body2"
                    color={files.length === 0 ? "text.secondary" : "text.primary"}
                    sx={{flex: "1 1 160px", minWidth: 0, overflowWrap: "anywhere"}}
                >
                    {files.length === 0 ? `${singleFormat} or ${bundleFormat}` : files.length === 1 ? files[0].name : `${files.length} files selected`}
                </AppTypography>
            </AppBox>
            <ActionBar>
                <AppButton type="button" disabled={files.length === 0 || loading} onClick={() => void handleImport()}>
                    {loading ? "Importing..." : submitLabel}
                </AppButton>
            </ActionBar>
            {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}
            {result ? <ImportResults results={result} importedLabel={importedLabel}/> : null}
        </SectionCard>
    );
}
