import React from "react";
import AuthContext from "@/services/AuthContext";
import {useReplayComboImport} from "@/hooks/useReplayComboImport";
import {ReplayComboExportDocument, ReplayComboImportResponse, ReplayComboImportResultRow} from "@/src/types/replayComboImport";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppSnackbar} from "@/src/components/ui/AppSnackbar";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

function normalizeApiError(error: unknown, fallbackMessage: string): string {
    if (typeof error !== "object" || error === null) {
        return fallbackMessage;
    }

    const responseError = error as {response?: {data?: {error?: string}}; message?: string};

    return responseError.response?.data?.error || responseError.message || fallbackMessage;
}

function isReplayComboExportDocument(value: unknown): value is ReplayComboExportDocument {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const document = value as Partial<ReplayComboExportDocument>;

    return document.format === "combo_export_v1" && typeof document.source === "object" && document.source !== null && Array.isArray(document.combos);
}

function ImportResults({result}: {result: ReplayComboImportResponse}) {
    return (
        <SectionCard title="Import Result" variant="review">
            <AppBox sx={{display: "flex", gap: 0.75, flexWrap: "wrap"}}>
                <AppTypography variant="body2" sx={{fontWeight: 650}}>Imported: {result.importedCount}</AppTypography>
                <AppTypography variant="body2" color="text.secondary">Skipped: {result.skippedCount}</AppTypography>
            </AppBox>
            <AppBox sx={{display: "grid", gap: 0.75}}>
                {result.results.map((row: ReplayComboImportResultRow) => (
                    <AppBox
                        key={row.id}
                        sx={{display: "grid", gap: 0.2, p: 0.9, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1, backgroundColor: "fgc.surface.subtle"}}
                    >
                        <AppTypography variant="body2" sx={{fontWeight: 650, overflowWrap: "anywhere"}}>{row.id}</AppTypography>
                        {row.status === "imported" ? (
                            <AppTypography variant="caption" color="success.main">Created pending combo #{row.comboId}.</AppTypography>
                        ) : (
                            <AppTypography variant="caption" color="error.main" sx={{overflowWrap: "anywhere"}}>{row.reason}</AppTypography>
                        )}
                    </AppBox>
                ))}
            </AppBox>
        </SectionCard>
    );
}

export default function ReplayComboImportsPage() {
    const authContext = React.useContext(AuthContext);
    const {importDocument} = useReplayComboImport();
    const [file, setFile] = React.useState<File | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<ReplayComboImportResponse | null>(null);
    const [toastOpen, setToastOpen] = React.useState(false);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {loading: authLoading, isAuthenticated, canManageUsers} = authContext;

    const handleImport = async (): Promise<void> => {
        if (!file) {
            setError("Choose a combo_export_v1 JSON file.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const parsed: unknown = JSON.parse(await file.text());
            if (!isReplayComboExportDocument(parsed)) {
                throw new Error("Choose a combo_export_v1 JSON document.");
            }

            const importResult = await importDocument(parsed);
            setResult(importResult);
            setToastOpen(true);
        } catch (importError: unknown) {
            setError(normalizeApiError(importError, "Unable to import replay combos."));
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <AppContainer maxWidth={false}><AppCircularProgress/></AppContainer>;
    }

    if (!isAuthenticated) {
        return null;
    }

    if (!canManageUsers) {
        return <AppContainer maxWidth={false}><InlineNotice severity="error">You do not have permission to import replay combos.</InlineNotice></AppContainer>;
    }

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Replay Combo Import">
                <SectionCard title="Combo Export" variant="input" tone="raised">
                    <AppTextField
                        label="combo_export_v1 JSON file"
                        type="file"
                        inputProps={{accept: "application/json,.json"}}
                        onChange={(event) => {
                            setFile((event.target as HTMLInputElement).files?.[0] ?? null);
                            setError(null);
                            setResult(null);
                        }}
                    />
                    {file ? <AppTypography variant="body2" color="text.secondary">{file.name}</AppTypography> : null}
                    <ActionBar>
                        <AppButton type="button" disabled={!file || loading} onClick={() => void handleImport()}>
                            {loading ? "Importing..." : "Import Pending Combos"}
                        </AppButton>
                    </ActionBar>
                </SectionCard>

                {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}
                {result ? <ImportResults result={result}/> : null}
            </PageShell>

            <AppSnackbar open={toastOpen} autoHideDuration={4000} onClose={() => setToastOpen(false)} anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
                <AppAlert severity="success" variant="filled" onClose={() => setToastOpen(false)}>
                    Import finished. Created combos are pending moderation.
                </AppAlert>
            </AppSnackbar>
        </AppContainer>
    );
}
