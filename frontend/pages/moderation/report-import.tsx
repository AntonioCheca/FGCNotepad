import React from "react";
import AuthContext from "@/services/AuthContext";
import {useReportBundleImport} from "@/hooks/useReportBundleImport";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {TextLink} from "@/src/components/ui/TextLink";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {REPORT_BUNDLE_FORMAT, type ReportBundleResult, type ReportBundleScenarioAction} from "@/src/types/reportBundle";

const ACTION_LABEL: Record<ReportBundleScenarioAction, string> = {
    create: "New",
    update: "Update",
    unchanged: "Unchanged",
    conflict: "Edited on site",
};

function errorMessage(error: unknown): string {
    if (error instanceof SyntaxError) {
        return "The file is not JSON.";
    }
    const maybe = error as {response?: {data?: {error?: string}}; message?: string} | null;

    return maybe?.response?.data?.error || maybe?.message || "Unable to read the report file.";
}

function ResultSummary({result}: {result: ReportBundleResult}) {
    const combos = result.combos;

    return (
        <AppBox sx={{display: "grid", gap: 1.25, minWidth: 0}}>
            {result.imported ? (
                <InlineNotice severity="success">
                    Imported and approved.{result.report ? <> <TextLink href={`/research/${result.report}`}>Open the report</TextLink></> : null}
                </InlineNotice>
            ) : null}
            {result.errors.map((error) => (
                <AppTypography key={error} variant="body2" color="error.main" sx={{overflowWrap: "anywhere"}}>{error}</AppTypography>
            ))}
            {combos ? (
                <AppTypography variant="body2">
                    <strong>Combos</strong> {combos.created} new · {combos.existing} already on the site{combos.approvedExisting > 0 ? ` · ${combos.approvedExisting} approved from the queue` : ""}
                </AppTypography>
            ) : null}
            {result.scenarios && result.scenarios.length > 0 ? (
                <AppBox component="ul" sx={{m: 0, pl: 2.5, display: "grid", gap: 0.5}}>
                    {result.scenarios.map((scenario) => (
                        <AppTypography key={scenario.name} component="li" variant="body2" sx={{overflowWrap: "anywhere"}}>
                            {scenario.name} <AppTypography component="span" variant="body2" color={scenario.action === "conflict" ? "warning.main" : "text.secondary"}>{ACTION_LABEL[scenario.action]}</AppTypography>
                        </AppTypography>
                    ))}
                </AppBox>
            ) : null}
            {result.resourceGrids !== undefined ? (
                <AppTypography variant="body2"><strong>Resource grids</strong> {result.resourceGrids}</AppTypography>
            ) : null}
        </AppBox>
    );
}

export default function ReportImportPage() {
    const authContext = React.useContext(AuthContext);
    const {dryRun, importDocument} = useReportBundleImport();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = React.useState<string | null>(null);
    const [document, setDocument] = React.useState<unknown>(null);
    const [overwriteSiteEdits, setOverwriteSiteEdits] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [result, setResult] = React.useState<ReportBundleResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const preview = async (nextDocument: unknown, overwrite: boolean): Promise<void> => {
        setBusy(true);
        setError(null);
        setResult(null);
        try {
            setResult(await dryRun(nextDocument, overwrite));
        } catch (previewError: unknown) {
            setError(errorMessage(previewError));
        } finally {
            setBusy(false);
        }
    };

    const chooseFile = async (file: File | undefined): Promise<void> => {
        if (!file) {
            return;
        }
        setFileName(file.name);
        setOverwriteSiteEdits(false);
        setDocument(null);
        try {
            const parsed: unknown = JSON.parse(await file.text());
            setDocument(parsed);
            await preview(parsed, false);
        } catch (readError: unknown) {
            setResult(null);
            setError(errorMessage(readError));
        }
    };

    const runImport = async (): Promise<void> => {
        if (document === null) {
            setError("Choose a report file first.");
            return;
        }
        setBusy(true);
        setError(null);
        try {
            setResult(await importDocument(document, overwriteSiteEdits));
        } catch (importError: unknown) {
            setError(errorMessage(importError));
        } finally {
            setBusy(false);
        }
    };

    const {loading: authLoading, isAuthenticated, canModerate} = authContext;
    if (authLoading) {
        return <AppContainer maxWidth={false}><AppCircularProgress/></AppContainer>;
    }
    if (!isAuthenticated) {
        return null;
    }
    if (!canModerate) {
        return <AppContainer maxWidth={false}><InlineNotice severity="error">You do not have permission to import reports.</InlineNotice></AppContainer>;
    }

    const conflict = result?.status === "conflict" || overwriteSiteEdits;
    const canImport = document !== null && result !== null && !result.imported && result.status === "ok";

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 2, md: 3, xl: 4}}}>
            <PageShell title="Report Import">
                <AppBox sx={{display: "grid", gap: 2, maxWidth: 720, minWidth: 0}}>
                    <AppBox sx={{display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25, minWidth: 0}}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            accept="application/json,.json"
                            aria-label={`${REPORT_BUNDLE_FORMAT} file`}
                            onChange={(event) => {
                                void chooseFile(event.target.files?.[0]);
                                event.target.value = "";
                            }}
                        />
                        <AppButton type="button" variant="outlined" color="secondary" disabled={busy} onClick={() => fileInputRef.current?.click()} sx={{minHeight: 44}}>
                            Choose file
                        </AppButton>
                        <AppTypography variant="body2" color={fileName ? "text.primary" : "text.secondary"} sx={{flex: "1 1 160px", minWidth: 0, overflowWrap: "anywhere"}}>
                            {fileName ?? REPORT_BUNDLE_FORMAT}
                        </AppTypography>
                    </AppBox>

                    {conflict ? (
                        <AppFormControlLabel
                            control={(
                                <AppCheckbox
                                    checked={overwriteSiteEdits}
                                    disabled={busy}
                                    onChange={(event) => {
                                        setOverwriteSiteEdits(event.target.checked);
                                        void preview(document, event.target.checked);
                                    }}
                                />
                            )}
                            label="Overwrite site edits"
                        />
                    ) : null}

                    {busy ? <AppBox sx={{display: "flex", alignItems: "center", gap: 1}}><AppCircularProgress size={20}/><AppTypography variant="body2" color="text.secondary">Working...</AppTypography></AppBox> : null}
                    {error ? <AppTypography variant="body2" color="error.main" sx={{overflowWrap: "anywhere"}}>{error}</AppTypography> : null}
                    {result ? <ResultSummary result={result}/> : null}

                    {canImport ? (
                        <AppBox>
                            <AppButton type="button" disabled={busy} onClick={() => void runImport()} sx={{minHeight: 44, width: {xs: "100%", sm: "auto"}}}>
                                Import and approve
                            </AppButton>
                        </AppBox>
                    ) : null}
                </AppBox>
            </PageShell>
        </AppContainer>
    );
}
