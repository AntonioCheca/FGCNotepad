import React from "react";

import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {
    ComboKnowledgeResponse,
    ComboRecommendationResponse,
    NotationPreference,
    ScenarioExecutionPreference,
    ScenarioExecutionSelection,
} from "@/src/types/scenarioExecution";
import type {ComboExecutionMode} from "@/src/types/comboExecution";

export function useExecutionProfile() {
    const {request} = useApi();

    const getExecutionPreference = React.useCallback(async (): Promise<ScenarioExecutionPreference> => {
        return request(() => api.get("/profile/execution-preference"));
    }, [request]);

    const updateExecutionPreference = React.useCallback(
        async (selection: ScenarioExecutionSelection): Promise<ScenarioExecutionPreference> => {
            return request(() =>
                api.put("/profile/execution-preference", {
                    defaultMode: selection.mode,
                    difficultyCap: selection.difficultyCap,
                })
            );
        },
        [request]
    );

    const getComboKnowledge = React.useCallback(async (characterId?: string): Promise<ComboKnowledgeResponse> => {
        return request(() =>
            api.get("/profile/combo-knowledge", {
                params: {
                    characterId: characterId || undefined,
                },
            })
        );
    }, [request]);

    const updateComboKnowledge = React.useCallback(
        async (characterId: string, knownComboIds: number[]): Promise<{characterId: string; knownComboIds: number[]}> => {
            return request(() =>
                api.put("/profile/combo-knowledge", {
                    characterId,
                    knownComboIds,
                })
            );
        },
        [request]
    );

    const getComboRecommendations = React.useCallback(
        async (characterId: string, difficultyCap: number): Promise<ComboRecommendationResponse> => {
            return request(() =>
                api.get("/profile/combo-recommendations", {
                    params: {
                        characterId,
                        difficultyCap,
                    },
                })
            );
        },
        [request]
    );

    const getNotationPreference = React.useCallback(async (): Promise<NotationPreference> => {
        return request(() => api.get("/profile/notation-preference"));
    }, [request]);

    const updateNotationPreference = React.useCallback(
        async (notationDictionary: NotationPreference["notationDictionary"]): Promise<NotationPreference> => {
            return request(() =>
                api.put("/profile/notation-preference", {
                    notationDictionary,
                })
            );
        },
        [request]
    );

    const getComboExecutionMode = React.useCallback(async (): Promise<{comboExecutionMode: ComboExecutionMode}> => {
        return request(() => api.get("/profile/combo-execution-mode"));
    }, [request]);

    const updateComboExecutionMode = React.useCallback(
        async (comboExecutionMode: ComboExecutionMode): Promise<{comboExecutionMode: ComboExecutionMode}> => {
            return request(() => api.put("/profile/combo-execution-mode", {comboExecutionMode}));
        },
        [request]
    );

    return {
        getComboExecutionMode,
        updateComboExecutionMode,
        getExecutionPreference,
        updateExecutionPreference,
        getComboKnowledge,
        updateComboKnowledge,
        getComboRecommendations,
        getNotationPreference,
        updateNotationPreference,
    };
}
