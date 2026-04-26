import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {
    ModerationContentType,
    ModerationDecisionResponse,
    ModerationQueueFilters,
    ModerationQueueResponse,
} from "@/src/types/moderation";

function toCsv(values: string[] | undefined): string | undefined {
    if (!values || values.length === 0) {
        return undefined;
    }

    return values.join(",");
}

export function useModeration() {
    const {request} = useApi();

    const getQueue = React.useCallback(async (filters: ModerationQueueFilters = {}): Promise<ModerationQueueResponse> => {
        return request(() =>
            api.get("/moderation/queue", {
                params: {
                    contentType: toCsv(filters.contentType),
                    state: toCsv(filters.state),
                    sort: filters.sort,
                },
            })
        );
    }, [request]);

    const approve = React.useCallback(async (
        contentType: ModerationContentType,
        contentId: string
    ): Promise<ModerationDecisionResponse> => {
        return request(() => api.post(`/moderation/${contentType}/${contentId}/approve`));
    }, [request]);

    const reject = React.useCallback(async (
        contentType: ModerationContentType,
        contentId: string,
        reason: string
    ): Promise<ModerationDecisionResponse> => {
        return request(() => api.post(`/moderation/${contentType}/${contentId}/reject`, {reason}));
    }, [request]);

    const hide = React.useCallback(async (
        contentType: ModerationContentType,
        contentId: string,
        reason: string
    ): Promise<ModerationDecisionResponse> => {
        return request(() => api.post(`/moderation/${contentType}/${contentId}/hide`, {reason}));
    }, [request]);

    return {
        getQueue,
        approve,
        reject,
        hide,
    };
}
