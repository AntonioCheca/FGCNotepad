import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {ReplayOkiImportResponse} from "@/src/types/replayOkiImport";

export function useReplayOkiImport() {
    const {request} = useApi();

    const importDocument = React.useCallback(async (document: unknown): Promise<ReplayOkiImportResponse> => {
        return request(() => api.post("/admin/replay-oki-imports", document));
    }, [request]);

    return {importDocument};
}
