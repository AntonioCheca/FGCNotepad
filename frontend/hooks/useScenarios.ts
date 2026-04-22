import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {MatrixDynamicComboPayload, MatrixPayload} from "@/src/types/matrixPayload";
import {ScenarioExecutionSelection} from "@/src/types/scenarioExecution";

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

interface ResolveDynamicCellsResponse {
    scenario: ScenarioDetail;
    resolution: {
        totalDynamicCells: number;
        resolvedCells: number;
        unresolvedCells: number;
    };
}

interface ResolveDynamicCellPreviewResponse {
    resolvedDamage: number | null;
    resolvedComboId: number | null;
    resolvedStarterMoveId: string | null;
}

interface ScenarioExecutionModePayload {
    mode: ScenarioExecutionSelection["mode"];
    difficultyCap: number | null;
}

function buildExecutionPayload(selection?: ScenarioExecutionSelection): {executionMode?: ScenarioExecutionModePayload} {
    if (!selection) {
        return {};
    }

    return {
        executionMode: {
            mode: selection.mode,
            difficultyCap: selection.mode === "difficulty_cap" ? selection.difficultyCap : null,
        },
    };
}

export interface ScenarioSearchFilters {
    q?: string;
    scenarioType?: ScenarioType | "";
    defenderCharacterId?: string;
    attackerCharacterId?: string;
    triggerMoveId?: string;
    size?: number;
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
                    size: typeof filters.size === "number" ? filters.size : undefined,
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

    const resolveDynamicCells = React.useCallback(async (
        id: string,
        executionSelection?: ScenarioExecutionSelection
    ): Promise<ResolveDynamicCellsResponse> => {
        return request(() => api.post(`/scenarios/${id}/resolve-dynamic-cells`, buildExecutionPayload(executionSelection)));
    }, [request]);

    const resolveDynamicCellPreview = React.useCallback(async (
        dynamicCombo: MatrixDynamicComboPayload,
        executionSelection?: ScenarioExecutionSelection
    ): Promise<ResolveDynamicCellPreviewResponse> => {
        return request(() => api.post('/scenarios/resolve-dynamic-cell', {
            ...dynamicCombo,
            ...buildExecutionPayload(executionSelection),
        }));
    }, [request]);

    return {
        listScenarios,
        getScenario,
        createScenario,
        updateScenario,
        deleteScenario,
        resolveDynamicCells,
        resolveDynamicCellPreview,
    };
}
