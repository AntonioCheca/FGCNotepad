import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";

interface CreatedFlagResponse {
    id: number;
    comment: string | null;
    createdAt: string;
}

interface CreatedScenarioFlagResponse extends CreatedFlagResponse {
    scenarioId: string;
}

interface CreatedComboFlagResponse extends CreatedFlagResponse {
    comboId: number;
}

export function useContentFlags() {
    const {request} = useApi();

    const createScenarioFlag = React.useCallback(async (scenarioId: string, comment?: string): Promise<CreatedScenarioFlagResponse> => {
        return request(() => api.post("/flags/scenarios", {scenarioId, comment: comment ?? null}));
    }, [request]);

    const createComboFlag = React.useCallback(async (comboId: number, comment?: string): Promise<CreatedComboFlagResponse> => {
        return request(() => api.post("/flags/combos", {comboId, comment: comment ?? null}));
    }, [request]);

    return {
        createScenarioFlag,
        createComboFlag,
    };
}
