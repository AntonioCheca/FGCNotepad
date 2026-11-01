import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {ScenarioExportDocument, ScenarioImportReport} from "@/src/types/scenarioTransfer";

function isImportReport(value: unknown): value is ScenarioImportReport {
    return typeof value === "object" && value !== null && typeof (value as {status?: unknown}).status === "string" && Array.isArray((value as {scenarios?: unknown}).scenarios);
}

export function downloadJsonFile(fileName: string, document: unknown): void {
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(document, null, 2)}\n`], {type: "application/json"}));
    const link = window.document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

export function useScenarioTransfer() {
    const {request} = useApi();

    const submit = React.useCallback(async (path: string, document: unknown, overwriteSiteEdits: boolean): Promise<ScenarioImportReport> => {
        try {
            return await request(() => api.post(path, document, {params: overwriteSiteEdits ? {overwriteSiteEdits: 1} : undefined}));
        } catch (error: unknown) {
            const data = (error as {response?: {data?: unknown}} | null)?.response?.data;
            if (isImportReport(data)) {
                return data;
            }
            throw error;
        }
    }, [request]);

    const dryRun = React.useCallback((document: unknown, overwriteSiteEdits: boolean) => submit("/admin/scenario-imports/dry-run", document, overwriteSiteEdits), [submit]);
    const importDocument = React.useCallback((document: unknown, overwriteSiteEdits: boolean) => submit("/admin/scenario-imports", document, overwriteSiteEdits), [submit]);

    const exportScenario = React.useCallback(async (scenarioId: string): Promise<ScenarioExportDocument> => {
        return request(() => api.get(`/admin/scenario-exports/${scenarioId}`));
    }, [request]);

    const exportSource = React.useCallback(async (source: string): Promise<ScenarioExportDocument> => {
        return request(() => api.get("/admin/scenario-exports", {params: {source}}));
    }, [request]);

    return {dryRun, importDocument, exportScenario, exportSource};
}
