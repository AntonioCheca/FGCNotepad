import React from "react";
import AuthContext from "@/services/AuthContext";
import {useReplayComboImport} from "@/hooks/useReplayComboImport";
import {useReplayOkiImport} from "@/hooks/useReplayOkiImport";
import {ImportRow, ReplayImportSection} from "@/src/components/admin/ReplayImportSection";
import {NeutralStatsImportSection} from "@/src/components/admin/NeutralStatsImportSection";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppSnackbar} from "@/src/components/ui/AppSnackbar";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";

const comboImportedLabel = (row: ImportRow): string => `Created pending combo #${row.comboId}.`;
const okiImportedLabel = (row: ImportRow): string => `Created Oki setup #${row.setupId} in profile #${row.profileId}.`;

export default function ReplayImportsPage() {
    const authContext = React.useContext(AuthContext);
    const {importDocument: importComboDocument} = useReplayComboImport();
    const {importDocument: importOkiDocument} = useReplayOkiImport();
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {loading: authLoading, isAuthenticated, canManageUsers} = authContext;

    if (authLoading) {
        return <AppContainer maxWidth={false}><AppCircularProgress/></AppContainer>;
    }

    if (!isAuthenticated) {
        return null;
    }

    if (!canManageUsers) {
        return <AppContainer maxWidth={false}><InlineNotice severity="error">You do not have permission to import replay data.</InlineNotice></AppContainer>;
    }

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Replay Import">
                <ReplayImportSection
                    title="Combo Export"
                    singleFormat="combo_export_v1"
                    bundleFormat="combo_export_bundle_v1"
                    submitLabel="Import Pending Combos"
                    importedLabel={comboImportedLabel}
                    importDocument={importComboDocument}
                    onFinished={() => setToastMessage("Import finished. Created combos are pending moderation.")}
                />
                <ReplayImportSection
                    title="Oki Export"
                    singleFormat="oki_export_v1"
                    bundleFormat="oki_export_bundle_v1"
                    submitLabel="Import Oki Setups"
                    importedLabel={okiImportedLabel}
                    importDocument={importOkiDocument}
                    onFinished={() => setToastMessage("Import finished. Created Oki setups are pending moderation.")}
                />
                <NeutralStatsImportSection onFinished={() => setToastMessage("Neutral stats import finished.")}/>
            </PageShell>

            <AppSnackbar open={toastMessage !== null} autoHideDuration={4000} onClose={() => setToastMessage(null)} anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
                <AppAlert severity="success" variant="filled" onClose={() => setToastMessage(null)}>
                    {toastMessage}
                </AppAlert>
            </AppSnackbar>
        </AppContainer>
    );
}
