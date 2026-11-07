import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {ReportBundleResult} from "@/src/types/reportBundle";

function isResult(value: unknown): value is ReportBundleResult {
    return typeof value === "object" && value !== null && typeof (value as {status?: unknown}).status === "string" && Array.isArray((value as {errors?: unknown}).errors);
}

// Rejected bundles still answer with a full result (400/409), so those are returned instead of thrown.
export function useReportBundleImport() {
    const {request} = useApi();

    const submit = React.useCallback(async (path: string, document: unknown, overwriteSiteEdits: boolean): Promise<ReportBundleResult> => {
        try {
            return await request(() => api.post(path, document, {params: overwriteSiteEdits ? {overwriteSiteEdits: 1} : undefined}));
        } catch (error: unknown) {
            const data = (error as {response?: {data?: unknown}} | null)?.response?.data;
            if (isResult(data)) {
                return data;
            }
            throw error;
        }
    }, [request]);

    const dryRun = React.useCallback((document: unknown, overwriteSiteEdits: boolean) => submit("/moderation/report-bundles/dry-run", document, overwriteSiteEdits), [submit]);
    const importDocument = React.useCallback((document: unknown, overwriteSiteEdits: boolean) => submit("/moderation/report-bundles", document, overwriteSiteEdits), [submit]);

    return {dryRun, importDocument};
}
