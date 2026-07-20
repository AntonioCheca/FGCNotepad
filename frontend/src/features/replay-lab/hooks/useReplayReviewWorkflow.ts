import React from "react";

import type {ReplayReviewSession, ReplayVideo} from "@/src/types/replayLab";
import {getReplayLabErrorMessage, isMp4File, rememberReplayExportSource, workflowForVideo, type WorkflowMode} from "../replayReviewUtils";

interface UseReplayReviewWorkflowOptions {
    createLocalFileVideo: (payload: {filename: string; sizeBytes: number}) => Promise<ReplayVideo>;
    createYouTubeVideo: (payload: {youtubeUrl: string; title: string | null}) => Promise<ReplayVideo>;
    createReviewSession: (payload: {videoId: string; title: string}) => Promise<ReplayReviewSession>;
    deleteReviewSession: (sessionId: string) => Promise<void>;
    fetchVideoPlaybackBlob: (videoId: string) => Promise<Blob>;
    refreshSessions: () => Promise<void>;
    onError: (message: string) => void;
    onNotice: (message: string) => void;
    onClearError: () => void;
    onClearNotice: () => void;
}

export function useReplayReviewWorkflow({
    createLocalFileVideo,
    createYouTubeVideo,
    createReviewSession,
    deleteReviewSession,
    fetchVideoPlaybackBlob,
    refreshSessions,
    onError,
    onNotice,
    onClearError,
    onClearNotice,
}: UseReplayReviewWorkflowOptions) {
    const [selectedVideo, setSelectedVideo] = React.useState<ReplayVideo | null>(null);
    const [activeSession, setActiveSession] = React.useState<ReplayReviewSession | null>(null);
    const [workflowMode, setWorkflowMode] = React.useState<WorkflowMode | null>(null);
    const [localSourceFile, setLocalSourceFile] = React.useState<File | null>(null);
    const [youtubeUrl, setYoutubeUrl] = React.useState("");
    const [youtubeTitle, setYoutubeTitle] = React.useState("");
    const [playbackUrl, setPlaybackUrl] = React.useState<string | null>(null);
    const [playerLoading, setPlayerLoading] = React.useState(false);
    const [startingWorkflow, setStartingWorkflow] = React.useState<WorkflowMode | null>(null);
    const [playbackPosition, setPlaybackPosition] = React.useState({timeMs: 0, frame: 0, durationMs: 0});
    const [seekCommand, setSeekCommand] = React.useState<{id: number; timeMs: number} | null>(null);

    const isEditorOpen = Boolean(activeSession && selectedVideo && workflowMode);
    const canMarkRange = Boolean(activeSession && selectedVideo && !playerLoading);

    React.useEffect(() => {
        return () => {
            if (playbackUrl) {
                URL.revokeObjectURL(playbackUrl);
            }
        };
    }, [playbackUrl]);

    const seekToTime = React.useCallback((timeMs: number) => {
        setSeekCommand({id: Date.now(), timeMs});
    }, []);

    const openEditor = React.useCallback(async (session: ReplayReviewSession, video: ReplayVideo, mode: WorkflowMode, file: File | null) => {
        setSelectedVideo(video);
        setActiveSession(session);
        setWorkflowMode(mode);
        setPlayerLoading(true);

        if (file) {
            rememberReplayExportSource(session.id, file);
        }

        try {
            let objectUrl: string | null = null;
            if (video.sourceType === "local_file") {
                if (!file) {
                    throw new Error(`Select the local source file "${video.originalFilename}" before opening this review.`);
                }
                if (!isMp4File(file)) {
                    throw new Error("Only MP4 files are supported. Convert MKV files to MP4 before review.");
                }
                objectUrl = URL.createObjectURL(file);
            } else if (video.sourceType !== "youtube") {
                objectUrl = URL.createObjectURL(await fetchVideoPlaybackBlob(video.id));
            }

            setPlaybackUrl((current) => {
                if (current) {
                    URL.revokeObjectURL(current);
                }
                return objectUrl;
            });
        } finally {
            setPlayerLoading(false);
        }
    }, [fetchVideoPlaybackBlob]);

    const startLocalReview = React.useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        if (!localSourceFile) {
            onError("Choose a local replay file before starting review.");
            return;
        }
        if (!isMp4File(localSourceFile)) {
            onError("Only MP4 files are supported. Convert MKV files to MP4 before review.");
            return;
        }

        onClearError();
        onClearNotice();
        setStartingWorkflow("local");
        try {
            const video = await createLocalFileVideo({filename: localSourceFile.name, sizeBytes: localSourceFile.size});
            const session = await createReviewSession({videoId: video.id, title: `Local review - ${localSourceFile.name}`});
            await openEditor(session, video, "local", localSourceFile);
            onNotice("Local review ready. The original file stays in your browser.");
            void refreshSessions().catch(() => undefined);
        } catch (caughtError: unknown) {
            onError(getReplayLabErrorMessage(caughtError));
        } finally {
            setStartingWorkflow(null);
        }
    }, [createLocalFileVideo, createReviewSession, localSourceFile, onClearError, onClearNotice, onError, onNotice, openEditor, refreshSessions]);

    const startYouTubeReview = React.useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        if (!localSourceFile) {
            onError("Choose the matching local original file before starting a coaching review.");
            return;
        }
        if (!isMp4File(localSourceFile)) {
            onError("Only MP4 files are supported. Convert MKV files to MP4 before review.");
            return;
        }
        if (!youtubeUrl.trim()) {
            onError("Paste a YouTube URL or video ID before starting review.");
            return;
        }

        onClearError();
        onClearNotice();
        setStartingWorkflow("coaching");
        try {
            const video = await createYouTubeVideo({youtubeUrl, title: youtubeTitle || null});
            const session = await createReviewSession({videoId: video.id, title: youtubeTitle || `Coaching review - ${localSourceFile.name}`});
            setYoutubeUrl("");
            setYoutubeTitle("");
            await openEditor(session, video, "coaching", localSourceFile);
            onNotice("Coaching review ready. YouTube handles shared playback; local file is kept for export.");
            void refreshSessions().catch(() => undefined);
        } catch (caughtError: unknown) {
            onError(getReplayLabErrorMessage(caughtError));
        } finally {
            setStartingWorkflow(null);
        }
    }, [createReviewSession, createYouTubeVideo, localSourceFile, onClearError, onClearNotice, onError, onNotice, openEditor, refreshSessions, youtubeTitle, youtubeUrl]);

    const openReviewSession = React.useCallback(async (session: ReplayReviewSession) => {
        const video = session.video;
        if (!video) {
            onError("This review session no longer has replay source metadata.");
            return;
        }

        const mode = workflowForVideo(video);
        if (!mode) {
            onError("This review session has an unsupported source type.");
            return;
        }

        if (video.sourceType === "local_file" && (!localSourceFile || localSourceFile.name !== video.originalFilename)) {
            onError(`Select "${video.originalFilename}" first, then reopen this local review.`);
            return;
        }

        onClearError();
        onClearNotice();
        try {
            await openEditor(session, video, mode, localSourceFile);
            onNotice(`Opened ${session.title}.`);
        } catch (caughtError: unknown) {
            onError(getReplayLabErrorMessage(caughtError));
        }
    }, [localSourceFile, onClearError, onClearNotice, onError, onNotice, openEditor]);

    const resetEditor = React.useCallback(() => {
        setActiveSession(null);
        setSelectedVideo(null);
        setWorkflowMode(null);
        setPlaybackPosition({timeMs: 0, frame: 0, durationMs: 0});
        setSeekCommand(null);
        setPlaybackUrl((current) => {
            if (current) {
                URL.revokeObjectURL(current);
            }
            return null;
        });
    }, []);

    const removeSession = React.useCallback(async (sessionId: string) => {
        onClearError();
        onClearNotice();
        try {
            await deleteReviewSession(sessionId);
            if (activeSession?.id === sessionId) {
                resetEditor();
            }
            await refreshSessions();
            onNotice("Draft deleted.");
        } catch (caughtError: unknown) {
            onError(getReplayLabErrorMessage(caughtError));
        }
    }, [activeSession?.id, deleteReviewSession, onClearError, onClearNotice, onError, onNotice, refreshSessions, resetEditor]);

    return {
        selectedVideo,
        activeSession,
        workflowMode,
        localSourceFile,
        youtubeUrl,
        youtubeTitle,
        playbackUrl,
        playerLoading,
        startingWorkflow,
        playbackPosition,
        seekCommand,
        isEditorOpen,
        canMarkRange,
        setLocalSourceFile,
        setYoutubeUrl,
        setYoutubeTitle,
        setPlaybackPosition,
        seekToTime,
        startLocalReview,
        startYouTubeReview,
        openReviewSession,
        removeSession,
        resetEditor,
    };
}
