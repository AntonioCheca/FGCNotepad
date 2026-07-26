import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {MatrixDynamicComboPayload, MatrixPayload} from "@/src/types/matrixPayload";
import {ScenarioExecutionSelection} from "@/src/types/scenarioExecution";

export type ScenarioType = "oki" | "blockstring" | "aggregated_oki";

export interface AggregatedDefenseCatalogItem {
    key: string;
    label: string;
}

export interface AggregatedDefenseCapabilitiesResponse {
    catalog: AggregatedDefenseCatalogItem[];
    capabilities: Record<string, boolean>;
    characterId: string | null;
    characterName: string | null;
}

export interface ScenarioListItem {
    id: string;
    name: string;
    label: string;
    scenarioType: ScenarioType;
    typeLabel: string;
    defenderCharacterId: string | null;
    defenderCharacterName: string | null;
    defenderCharacterLife?: number | null;
    attackerCharacterId: string | null;
    attackerCharacterName: string | null;
    attackerCharacterLife?: number | null;
    triggerMoveId: string | null;
    triggerMoveLabel: string | null;
    updatedAt: string;
}

export interface ScenarioDetail extends ScenarioListItem {
    searchLabel: string;
    matrix: MatrixPayload;
    comboContext: ScenarioComboContextPayload;
    createdAt: string;
    author: string | null;
}

export type ScenarioPositionLock = "viewer_default_midscreen" | "corner" | "midscreen";

export interface ScenarioCharacterStatusPayload {
    id?: number | null;
    object_name: string;
    status_required: string | number | boolean;
}

export interface ScenarioComboContextPayload {
    positionLock: ScenarioPositionLock;
    characterStatuses: ScenarioCharacterStatusPayload[];
}

export interface ScenarioComboContextViewerPayload {
    includeCornerSpecific?: boolean;
}

export interface ScenarioComboContextCatalog {
    positionLocks: Array<{value: ScenarioPositionLock; label: string}>;
    characterStatuses: Array<{name: string; status_type: "integer" | "boolean"; max_status: number | null}>;
}

export interface ScenarioSavePayload {
    name: string;
    scenarioType: ScenarioType;
    defenderCharacterId: string;
    attackerCharacterId: string;
    triggerMoveId: string;
    matrix: MatrixPayload;
    comboContext?: ScenarioComboContextPayload;
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

export interface ScenarioResourceContextPayload {
    attacker: {
        health: number;
        drive: number;
        super: number;
    };
    defender: {
        health: number;
        drive: number;
        super: number;
    };
}

export interface ScenarioLayerSolveSnapshot {
    rowAxis: Array<number | null>;
    columnAxis: Array<number | null>;
    expectedValue: number | null;
}

export interface ScenarioLayerSolveResponse {
    scenarioId: string;
    executionMode: ScenarioExecutionModePayload;
    maxLayer: number;
    layers: Record<string, ScenarioLayerSolveSnapshot>;
}

export interface ScenarioResolvedLinkedCell {
    row: number;
    column: number;
    scenarioId: string | null;
    basePreValue: number;
    linkedExpectedValue: number;
    finalValue: number;
    depth: number;
}

export interface ScenarioLinkedExpectedValueResponse extends ScenarioLayerSolveSnapshot {
    scenarioId: string;
    executionMode: ScenarioExecutionModePayload;
    depth: number;
    resolvedCells: ScenarioResolvedLinkedCell[];
}

function buildExecutionPayload(
    selection?: ScenarioExecutionSelection,
    resourceContext?: ScenarioResourceContextPayload,
    comboContext?: ScenarioComboContextViewerPayload
): {executionMode?: ScenarioExecutionModePayload; resourceContext?: ScenarioResourceContextPayload; comboContext?: ScenarioComboContextViewerPayload} {
    const resourcePayload = resourceContext ? {resourceContext} : {};
    const comboPayload = comboContext ? {comboContext} : {};

    if (!selection) {
        return {...resourcePayload, ...comboPayload};
    }

    return {
        executionMode: {
            mode: selection.mode,
            difficultyCap: selection.mode === "difficulty_cap" ? selection.difficultyCap : null,
        },
        ...resourcePayload,
        ...comboPayload,
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
        executionSelection?: ScenarioExecutionSelection,
        resourceContext?: ScenarioResourceContextPayload,
        comboContext?: ScenarioComboContextViewerPayload
    ): Promise<ResolveDynamicCellsResponse> => {
        return request(() => api.post(`/scenarios/${id}/resolve-dynamic-cells`, buildExecutionPayload(executionSelection, resourceContext, comboContext)));
    }, [request]);

    const resolveDynamicCellPreview = React.useCallback(async (
        dynamicCombo: MatrixDynamicComboPayload,
        executionSelection?: ScenarioExecutionSelection,
        resourceContext?: ScenarioResourceContextPayload
    ): Promise<ResolveDynamicCellPreviewResponse> => {
        return request(() => api.post('/scenarios/resolve-dynamic-cell', {
            ...dynamicCombo,
            ...buildExecutionPayload(executionSelection, resourceContext),
        }));
    }, [request]);

    const getComboContextCatalog = React.useCallback(async (): Promise<ScenarioComboContextCatalog> => {
        return request(() => api.get('/scenarios/combo-context/catalog'));
    }, [request]);

    const getAggregatedDefenseCapabilities = React.useCallback(async (
        characterId?: string
    ): Promise<AggregatedDefenseCapabilitiesResponse> => {
        return request(() =>
            api.get('/scenarios/aggregated-defense-capabilities', {
                params: {
                    characterId: characterId && characterId.trim() !== '' ? characterId : undefined,
                },
            })
        );
    }, [request]);

    const solveScenarioLayers = React.useCallback(async (
        id: string,
        executionSelection?: ScenarioExecutionSelection
    ): Promise<ScenarioLayerSolveResponse> => {
        return request(() => api.post(`/scenarios/${id}/solve-layers`, buildExecutionPayload(executionSelection)));
    }, [request]);

    const solveScenarioLinkedExpectedValue = React.useCallback(async (
        id: string,
        executionSelection?: ScenarioExecutionSelection,
        resourceContext?: ScenarioResourceContextPayload,
        comboContext?: ScenarioComboContextViewerPayload
    ): Promise<ScenarioLinkedExpectedValueResponse> => {
        return request(() => api.post(`/scenarios/${id}/solve-linked-ev`, buildExecutionPayload(executionSelection, resourceContext, comboContext)));
    }, [request]);

    return {
        listScenarios,
        getScenario,
        createScenario,
        updateScenario,
        deleteScenario,
        resolveDynamicCells,
        resolveDynamicCellPreview,
        getComboContextCatalog,
        getAggregatedDefenseCapabilities,
        solveScenarioLayers,
        solveScenarioLinkedExpectedValue,
    };
}
