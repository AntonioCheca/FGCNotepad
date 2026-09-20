import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {ReplayComboImportResponse} from "@/src/types/replayComboImport";

export function useReplayComboImport() {
    const {request} = useApi();

    const importDocument = React.useCallback(async (document: unknown): Promise<ReplayComboImportResponse> => {
        return request(() => api.post("/admin/replay-combo-imports", document));
    }, [request]);

    return {importDocument};
}
