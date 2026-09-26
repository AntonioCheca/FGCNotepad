import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {NeutralStatsImportResponse} from "@/src/types/neutralStats";

export function useNeutralStatsImport() {
    const {request} = useApi();

    const importBundle = React.useCallback(async (bundle: unknown): Promise<NeutralStatsImportResponse> => {
        return request(() => api.post("/admin/neutral-stats-imports", bundle));
    }, [request]);

    return {importBundle};
}
