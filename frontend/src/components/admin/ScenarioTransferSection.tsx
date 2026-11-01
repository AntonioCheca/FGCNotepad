import React from "react";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {downloadJsonFile, useScenarioTransfer} from "@/hooks/useScenarioTransfer";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {TextLink} from "@/src/components/ui/TextLink";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {
    SCENARIO_EXPORT_FORMAT,
    type ScenarioImportDynamicCell,
    type ScenarioImportReport,
    type ScenarioImportReportScenario,
} from "@/src/types/scenarioTransfer";

const DEFAULT_SOURCE = "sf6replaysdb";
const HIT_CONDITION_PREFIX: Record<string, string> = {counter_hit: "CH ", punish_counter: "PC ", perfect_parry: "PP "};
const ACTION_LABEL: Record<ScenarioImportReportScenario["action"], string> = {
    create: "New",
    update: "Update",
    unchanged: "Unchanged",
    conflict: "Edited on site",
};
const STATUS_MESSAGE: Record<ScenarioImportReport["status"], string | null> = {
    ok: null,
    invalid: "The file does not match this database.",
    unresolved_starters: "Some dynamic starters resolve to no stored combo. Import those combos first.",
    conflict: "Some scenarios were edited on the site since their last import. Tick Overwrite site edits to replace them.",
};

function errorMessage(error: unknown): string {
    const responseError = error as {response?: {data?: {error?: string}}; message?: string} | null;

    return responseError?.response?.data?.error || responseError?.message || "Unable to process the scenario file.";
}

function formatValue(value: number | null): string {
    return value === null ? "-" : String(Math.round(value));
}

function DynamicCellLine({cell}: {cell: ScenarioImportDynamicCell}) {
    const starter = `${HIT_CONDITION_PREFIX[cell.hitCondition] ?? ""}${cell.character} ${cell.moves.join(" / ")}`;
    const levels = cell.levels
        .map((level) => `${level.label}: ${level.starterMoveOnly ? "starter only" : formatValue(level.value)}`)
        .join(" · ");

    return (
        <AppTypography variant="caption" color={cell.resolved ? "text.secondary" : "warning.main"} sx={{overflowWrap: "anywhere"}}>
            {cell.row} × {cell.column}: {starter}: {cell.resolved ? formatValue(cell.value) : "no combo"} ({levels})
        </AppTypography>
    );
}

function ScenarioReportItem({scenario}: {scenario: ScenarioImportReportScenario}) {
    const unresolved = scenario.unresolvedStarters?.length ?? 0;

    return (
        <AppBox sx={{display: "grid", gap: 0.35, p: 0.9, border: "1px solid", borderColor: (theme: Theme) => theme.fgc.border.default, borderRadius: 1, backgroundColor: (theme: Theme) => theme.fgc.surface.subtle}}>
            <AppBox sx={{display: "flex", gap: 1, flexWrap: "wrap", alignItems: "baseline"}}>
                <AppTypography variant="body2" sx={{fontWeight: 650, overflowWrap: "anywhere"}}>{scenario.name}</AppTypography>
                <AppTypography variant="caption" color={scenario.action === "conflict" ? "warning.main" : "text.secondary"}>{ACTION_LABEL[scenario.action]}</AppTypography>
                {scenario.url ? <TextLink href={scenario.url}>Open</TextLink> : null}
            </AppBox>
            <AppTypography variant="caption" color="text.secondary" sx={{overflowWrap: "anywhere"}}>{scenario.key.source}/{scenario.key.externalId}</AppTypography>
            {scenario.conflict ? <AppTypography variant="caption" color="warning.main">{scenario.conflict}</AppTypography> : null}
            {unresolved > 0 ? <AppTypography variant="caption" color="warning.main">Unresolved starters: {unresolved}</AppTypography> : null}
            {scenario.dynamicCells?.map((cell) => <DynamicCellLine key={cell.path} cell={cell}/>)}
        </AppBox>
    );
}

function ImportReport({report}: {report: ScenarioImportReport}) {
    const message = report.imported ? null : STATUS_MESSAGE[report.status];

    return (
        <AppBox sx={{display: "grid", gap: 0.75, minWidth: 0}}>
            {message ? <AppTypography variant="body2" color={report.status === "ok" ? "success.main" : "warning.main"}>{message}</AppTypography> : null}
            {report.errors.map((error) => (
                <AppTypography key={error} variant="caption" color="error.main" sx={{overflowWrap: "anywhere"}}>{error}</AppTypography>
            ))}
            {report.scenarios.map((scenario) => <ScenarioReportItem key={`${scenario.key.source}/${scenario.key.externalId}`} scenario={scenario}/>)}
        </AppBox>
    );
}

export function ScenarioTransferSection({onImported}: {onImported: () => void}) {
    const {dryRun, importDocument, exportSource} = useScenarioTransfer();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [overwriteSiteEdits, setOverwriteSiteEdits] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [report, setReport] = React.useState<ScenarioImportReport | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [source, setSource] = React.useState(DEFAULT_SOURCE);

    const run = async (mode: "preview" | "import"): Promise<void> => {
        if (!file) {
            return;
        }

        setBusy(true);
        setError(null);
        setReport(null);
        try {
            const document: unknown = JSON.parse(await file.text());
            const result = mode === "preview" ? await dryRun(document, overwriteSiteEdits) : await importDocument(document, overwriteSiteEdits);
            setReport(result);
            if (result.imported) {
                onImported();
            }
        } catch (runError: unknown) {
            setError(errorMessage(runError));
        } finally {
            setBusy(false);
        }
    };

    const handleExport = async (): Promise<void> => {
        setBusy(true);
        setError(null);
        try {
            const trimmedSource = source.trim();
            downloadJsonFile(`scenarios-${trimmedSource}-${new Date().toISOString().slice(0, 10)}.json`, await exportSource(trimmedSource));
        } catch (exportError: unknown) {
            setError(errorMessage(exportError));
        } finally {
            setBusy(false);
        }
    };

    return (
        <SectionCard title="Scenario Export" tone="raised">
            <AppBox sx={{display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25, minWidth: 0}}>
                <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="application/json,.json"
                    aria-label={`${SCENARIO_EXPORT_FORMAT} JSON file`}
                    onChange={(event) => {
                        setFile(event.target.files?.[0] ?? null);
                        setReport(null);
                        setError(null);
                        event.target.value = "";
                    }}
                />
                <AppButton type="button" variant="outlined" color="secondary" onClick={() => fileInputRef.current?.click()} sx={{flexShrink: 0, minHeight: 40}}>
                    Choose file
                </AppButton>
                <AppTypography variant="body2" color={file ? "text.primary" : "text.secondary"} sx={{flex: "1 1 160px", minWidth: 0, overflowWrap: "anywhere"}}>
                    {file ? file.name : SCENARIO_EXPORT_FORMAT}
                </AppTypography>
                <AppFormControlLabel
                    control={<AppCheckbox size="small" checked={overwriteSiteEdits} onChange={(event) => setOverwriteSiteEdits(event.target.checked)}/>}
                    label="Overwrite site edits"
                />
            </AppBox>
            <ActionBar>
                <AppButton type="button" variant="outlined" color="secondary" disabled={!file || busy} onClick={() => void run("preview")}>
                    Dry Run
                </AppButton>
                <AppButton type="button" disabled={!file || busy} onClick={() => void run("import")}>
                    {busy ? "Working..." : "Import Scenarios"}
                </AppButton>
            </ActionBar>
            {error ? <AppTypography variant="body2" color="error.main" sx={{overflowWrap: "anywhere"}}>{error}</AppTypography> : null}
            {report ? <ImportReport report={report}/> : null}
            <AppBox sx={{display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25, pt: 1, borderTop: "1px solid", borderColor: "divider"}}>
                <AppTextField
                    size="small"
                    label="Imported from source"
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    sx={{width: {xs: "100%", sm: 220}}}
                />
                <AppButton type="button" variant="outlined" color="secondary" disabled={source.trim() === "" || busy} onClick={() => void handleExport()} sx={{minHeight: 40}}>
                    Export Scenarios
                </AppButton>
            </AppBox>
        </SectionCard>
    );
}
