import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {MatrixPayload} from "@/src/types/matrixPayload";

export type ScenarioType = "oki" | "blockstun";

export interface ScenarioListItem {
    id: string;
    name: string;
    label: string;
    scenarioType: ScenarioType;
    typeLabel: string;
    defenderCharacterId: string | null;
    defenderCharacterName: string | null;
    attackerCharacterId: string | null;
    attackerCharacterName: string | null;
    triggerMoveId: string | null;
    triggerMoveLabel: string | null;
    updatedAt: string;
}

export interface ScenarioDetail extends ScenarioListItem {
    searchLabel: string;
    matrix: MatrixPayload;
    createdAt: string;
    author: string | null;
}

export interface ScenarioSavePayload {
    name: string;
    scenarioType: ScenarioType;
    defenderCharacterId: string;
    attackerCharacterId: string;
    triggerMoveId: string;
    matrix: MatrixPayload;
}

export interface ScenarioSearchFilters {
    q?: string;
    scenarioType?: ScenarioType | "";
    defenderCharacterId?: string;
    attackerCharacterId?: string;
    triggerMoveId?: string;
}

export function useScenarios() {
    const {request} = useApi();

    const listScenarios = React.useCallback(async (filters: ScenarioSearchFilters = {}): Promise<ScenarioListItem[]> => {
        return request(() =>
            api.get("/scenarios", {
                params: {
                    q: filters.q?.trim() || undefined,
                    scenarioType: filters.scenarioType || undefined,
                    defenderCharacterId: filters.defenderCharacterId || undefined,
                    attackerCharacterId: filters.attackerCharacterId || undefined,
                    triggerMoveId: filters.triggerMoveId || undefined,
                },
            })
        );
    }, [request]);

    const getScenario = React.useCallback(async (id: string): Promise<ScenarioDetail> => {
        return request(() => api.get(`/scenarios/${id}`));
    }, [request]);

    const createScenario = React.useCallback(async (payload: ScenarioSavePayload): Promise<ScenarioDetail> => {
        return request(() => api.post("/scenarios", payload));
    }, [request]);

    const updateScenario = React.useCallback(async (id: string, payload: Partial<ScenarioSavePayload>): Promise<ScenarioDetail> => {
        return request(() => api.patch(`/scenarios/${id}`, payload));
    }, [request]);

    const deleteScenario = React.useCallback(async (id: string): Promise<void> => {
        await request(() => api.delete(`/scenarios/${id}`));
    }, [request]);

    return {
        listScenarios,
        getScenario,
        createScenario,
        updateScenario,
        deleteScenario,
    };
}
