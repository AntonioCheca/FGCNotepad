import React from "react";

import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {
    ComboKnowledgeResponse,
    ComboRecommendationResponse,
    ScenarioExecutionPreference,
    ScenarioExecutionSelection,
} from "@/src/types/scenarioExecution";

export function hasJwtToken(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    const token = localStorage.getItem("jwt");

    return typeof token === "string" && token.length > 0;
}

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

    return {
        getExecutionPreference,
        updateExecutionPreference,
        getComboKnowledge,
        updateComboKnowledge,
        getComboRecommendations,
    };
}
