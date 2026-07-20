import React from "react";

import type {CreateReplayReviewShareLinkRequest, ReplayReviewAccess, ReplayReviewSession} from "@/src/types/replayLab";
import {getReplayLabErrorMessage, type WorkflowMode} from "../replayReviewUtils";

interface UseReplayCoachSharingOptions {
    activeSession: ReplayReviewSession | null;
    workflowMode: WorkflowMode | null;
    createShareLink: (sessionId: string, payload: CreateReplayReviewShareLinkRequest) => Promise<ReplayReviewAccess>;
    listShareLinks: (sessionId: string) => Promise<ReplayReviewAccess[]>;
    revokeShareLink: (shareLinkId: string) => Promise<ReplayReviewAccess>;
    onError: (message: string) => void;
    onNotice: (message: string) => void;
    onClearError: () => void;
    onClearNotice: () => void;
}

export function useReplayCoachSharing({
    activeSession,
    workflowMode,
    createShareLink,
    listShareLinks,
    revokeShareLink,
    onError,
    onNotice,
    onClearError,
    onClearNotice,
}: UseReplayCoachSharingOptions) {
    const [shareLabel, setShareLabel] = React.useState("Coach review");
    const [shareExpiresAt, setShareExpiresAt] = React.useState("");
    const [sharePassword, setSharePassword] = React.useState("");
    const [shareLinks, setShareLinks] = React.useState<ReplayReviewAccess[]>([]);
    const [createdShareLink, setCreatedShareLink] = React.useState<ReplayReviewAccess | null>(null);

    const refreshShareLinks = React.useCallback(async (sessionId: string) => {
        setShareLinks(await listShareLinks(sessionId));
    }, [listShareLinks]);

    const generateShareLink = React.useCallback(async () => {
        if (!activeSession || workflowMode !== "coaching") {
            onError("Coach links are only available for Coaching Review.");
            return;
        }

        onClearError();
        onClearNotice();
        try {
            const link = await createShareLink(activeSession.id, {
                label: shareLabel,
                expiresAt: shareExpiresAt || null,
                canView: true,
                canAnnotate: true,
                password: sharePassword || null,
            });
            setCreatedShareLink(link);
            setSharePassword("");
            await refreshShareLinks(activeSession.id);
            onNotice("Coach link created.");
        } catch (caughtError: unknown) {
            onError(getReplayLabErrorMessage(caughtError));
        }
    }, [activeSession, createShareLink, onClearError, onClearNotice, onError, onNotice, refreshShareLinks, shareExpiresAt, shareLabel, sharePassword, workflowMode]);

    const revokeCoachLink = React.useCallback(async (shareLinkId: string) => {
        if (!activeSession) {
            return;
        }

        onClearError();
        onClearNotice();
        try {
            await revokeShareLink(shareLinkId);
            await refreshShareLinks(activeSession.id);
            onNotice("Coach link revoked.");
        } catch (caughtError: unknown) {
            onError(getReplayLabErrorMessage(caughtError));
        }
    }, [activeSession, onClearError, onClearNotice, onError, onNotice, refreshShareLinks, revokeShareLink]);

    const resetShareState = React.useCallback(() => {
        setShareLinks([]);
        setCreatedShareLink(null);
    }, []);

    const sharedReviewUrl = createdShareLink?.token && typeof window !== "undefined"
        ? `${window.location.origin}/replay-lab/shared/${createdShareLink.token}`
        : null;

    return {
        shareLabel,
        shareExpiresAt,
        sharePassword,
        shareLinks,
        createdShareLink,
        sharedReviewUrl,
        setShareLabel,
        setShareExpiresAt,
        setSharePassword,
        refreshShareLinks,
        generateShareLink,
        revokeCoachLink,
        resetShareState,
    };
}
