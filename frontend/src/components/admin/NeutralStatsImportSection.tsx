import React from "react";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {useNeutralStatsImport} from "@/hooks/useNeutralStatsImport";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {NeutralStatsImportResponse} from "@/src/types/neutralStats";

const BUNDLE_FORMAT = "neutral_stats_bundle_v2";

interface FileImportResult {
    fileName: string;
    response?: NeutralStatsImportResponse;
    error?: string;
}

function errorMessage(error: unknown): string {
    const responseError = error as {response?: {data?: {error?: string}}; message?: string} | null;

    return responseError?.response?.data?.error || responseError?.message || "Unable to import neutral stats.";
}

function ImportSummary({result}: {result: FileImportResult}) {
    const response = result.response;
    const failedReplays = response?.replays.filter((replay) => replay.error !== undefined) ?? [];

    return (
        <AppBox sx={{display: "grid", gap: 0.5, p: 0.9, border: "1px solid", borderColor: (theme: Theme) => theme.fgc.border.default, borderRadius: 1, backgroundColor: (theme: Theme) => theme.fgc.surface.subtle}}>
            <AppTypography variant="body2" sx={{fontWeight: 650, overflowWrap: "anywhere"}}>{result.fileName}</AppTypography>
            {result.error !== undefined ? <AppTypography variant="caption" color="error.main" sx={{overflowWrap: "anywhere"}}>{result.error}</AppTypography> : null}
            {response ? (
                <>
                    <AppBox sx={{display: "flex", gap: 1.25, flexWrap: "wrap"}}>
                        <AppTypography variant="body2">Replays: {response.importedReplayCount} / {response.replayCount}</AppTypography>
                        <AppTypography variant="body2">Observations: {response.observationCount}</AppTypography>
                        <AppTypography variant="body2" color="success.main">Mapped: {response.importedObservationCount}</AppTypography>
                        <AppTypography variant="body2" color={response.skippedObservationCount > 0 ? "warning.main" : "text.secondary"}>Skipped: {response.skippedObservationCount}</AppTypography>
                    </AppBox>
                    {response.unmappedMoves.length > 0 ? (
                        <AppBox sx={{display: "grid", gap: 0.2}}>
                            <AppTypography variant="caption" sx={{fontWeight: 650}}>Unmapped moves</AppTypography>
                            {response.unmappedMoves.map((move) => (
                                <AppTypography key={`${move.character}|${move.notation}|${move.actionId ?? ""}`} variant="caption" color="warning.main" sx={{overflowWrap: "anywhere"}}>
                                    {move.character} {move.notation}{move.moveName ? ` (${move.moveName})` : ""}{move.actionId !== null ? `, action ${move.actionId}` : ""}: {move.count}
                                </AppTypography>
                            ))}
                        </AppBox>
                    ) : null}
                    {[...response.warnings, ...failedReplays.map((replay) => `${replay.replayId}: ${replay.error}`)].map((warning) => (
                        <AppTypography key={warning} variant="caption" color="warning.main" sx={{overflowWrap: "anywhere"}}>{warning}</AppTypography>
                    ))}
                </>
            ) : null}
        </AppBox>
    );
}

export function NeutralStatsImportSection({onFinished}: {onFinished: () => void}) {
    const {importBundle} = useNeutralStatsImport();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [files, setFiles] = React.useState<File[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [results, setResults] = React.useState<FileImportResult[]>([]);

    const handleImport = async (): Promise<void> => {
        setLoading(true);
        const fileResults: FileImportResult[] = [];
        for (const file of files) {
            try {
                const parsed: unknown = JSON.parse(await file.text());
                if (typeof parsed !== "object" || parsed === null || (parsed as {format?: unknown}).format !== BUNDLE_FORMAT) {
                    throw new Error(`Not a ${BUNDLE_FORMAT} JSON document.`);
                }
                fileResults.push({fileName: file.name, response: await importBundle(parsed)});
            } catch (importError: unknown) {
                fileResults.push({fileName: file.name, error: errorMessage(importError)});
            }
            setResults([...fileResults]);
        }
        setLoading(false);
        onFinished();
    };

    return (
        <SectionCard title="Neutral Stats Export" variant="input" tone="raised">
            <AppBox sx={{display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25, minWidth: 0}}>
                <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    multiple
                    accept="application/json,.json"
                    aria-label={`${BUNDLE_FORMAT} JSON files`}
                    onChange={(event) => {
                        setFiles(Array.from(event.target.files ?? []));
                        setResults([]);
                        event.target.value = "";
                    }}
                />
                <AppButton type="button" variant="outlined" color="secondary" onClick={() => fileInputRef.current?.click()} sx={{flexShrink: 0, minHeight: 40}}>
                    Choose files
                </AppButton>
                <AppTypography variant="body2" color={files.length === 0 ? "text.secondary" : "text.primary"} sx={{flex: "1 1 160px", minWidth: 0, overflowWrap: "anywhere"}}>
                    {files.length === 0 ? BUNDLE_FORMAT : files.length === 1 ? files[0].name : `${files.length} files selected`}
                </AppTypography>
            </AppBox>
            <ActionBar>
                <AppButton type="button" disabled={files.length === 0 || loading} onClick={() => void handleImport()}>
                    {loading ? "Importing..." : "Import Neutral Stats"}
                </AppButton>
            </ActionBar>
            {results.map((result) => <ImportSummary key={result.fileName} result={result}/>)}
        </SectionCard>
    );
}
