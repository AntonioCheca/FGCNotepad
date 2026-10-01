import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {
    FrameDataModerationMovesResponse,
    FrameDataModerationValue,
    ModernAutoComboStrength,
    ModernAutoCombos,
    MoveModernData,
    MoveResourceEffect,
} from "@/src/types/frameDataModeration";

export function useFrameDataModeration() {
    const {request} = useApi();

    const getMovesForCharacter = React.useCallback(async (characterId: string): Promise<FrameDataModerationMovesResponse> => {
        return request(() => api.get(`/moderation/frame-data/characters/${characterId}/moves`));
    }, [request]);

    const saveOverride = React.useCallback(async (
        frameDataId: string,
        columnName: string,
        value: number | string | null
    ): Promise<FrameDataModerationValue & {columnName: string}> => {
        return request(() => api.patch(`/moderation/frame-data/overrides/${frameDataId}/${columnName}`, {value}));
    }, [request]);

    const saveManualMetadata = React.useCallback(async (
        moveId: string,
        whiffOnCrouch: boolean,
        forcesStanding: boolean
    ): Promise<{moveId: string; whiffOnCrouch: boolean; forcesStanding: boolean}> => {
        return request(() => api.patch(`/moderation/frame-data/manual-metadata/${moveId}`, {whiffOnCrouch, forcesStanding}));
    }, [request]);

    const saveResourceEffects = React.useCallback(async (
        moveId: string,
        effects: Array<{resourceId: number; mode: "relative" | "set"; amount: number}>
    ): Promise<{moveId: string; resourceEffects: MoveResourceEffect[]}> => {
        return request(() => api.patch(`/moderation/frame-data/resource-effects/${moveId}`, {effects}));
    }, [request]);

    const saveModernData = React.useCallback(async (moveId: string, modern: MoveModernData): Promise<{moveId: string; modern: MoveModernData}> => {
        return request(() => api.patch(`/moderation/frame-data/modern/${moveId}`, modern));
    }, [request]);

    const getModernAutoCombos = React.useCallback(async (characterId: string): Promise<{autoCombos: ModernAutoCombos}> => {
        return request(() => api.get(`/moderation/frame-data/characters/${characterId}/modern-auto-combos`));
    }, [request]);

    const saveModernAutoCombo = React.useCallback(async (
        characterId: string,
        strength: ModernAutoComboStrength,
        comboId: number | null
    ): Promise<{autoCombos: ModernAutoCombos}> => {
        return request(() => api.put(`/moderation/frame-data/characters/${characterId}/modern-auto-combos/${strength}`, {comboId}));
    }, [request]);

    return {getMovesForCharacter, saveOverride, saveManualMetadata, saveResourceEffects, saveModernData, getModernAutoCombos, saveModernAutoCombo};
}
