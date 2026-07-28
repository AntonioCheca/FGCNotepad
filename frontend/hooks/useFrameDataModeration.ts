import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {FrameDataModerationMovesResponse, FrameDataModerationValue} from "@/src/types/frameDataModeration";

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

    return {getMovesForCharacter, saveOverride, saveManualMetadata};
}
