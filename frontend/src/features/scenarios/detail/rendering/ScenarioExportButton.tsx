import React from "react";
import {downloadJsonFile, useScenarioTransfer} from "@/hooks/useScenarioTransfer";
import {AppButton} from "@/src/components/ui/AppButton";

export function ScenarioExportButton({scenarioId}: {scenarioId: string}) {
    const {exportScenario} = useScenarioTransfer();
    const [exporting, setExporting] = React.useState(false);
    const [failed, setFailed] = React.useState(false);

    const handleExport = async (): Promise<void> => {
        setExporting(true);
        setFailed(false);
        try {
            downloadJsonFile(`scenario-${scenarioId}.json`, await exportScenario(scenarioId));
        } catch {
            setFailed(true);
        } finally {
            setExporting(false);
        }
    };

    return (
        <AppButton type="button" variant="outlined" color={failed ? "error" : "secondary"} disabled={exporting} onClick={() => void handleExport()}>
            {failed ? "Export failed, retry" : exporting ? "Exporting..." : "Export JSON"}
        </AppButton>
    );
}
