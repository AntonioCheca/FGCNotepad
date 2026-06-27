import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {
    CreateReplayAnnotationRequest,
    CreateReplayReviewSessionRequest,
    CreateReplayReviewShareLinkRequest,
    ReplayAnnotation,
    ReplayAnnotationExportResult,
    ReplayLabLimits,
    ReplayReviewAccess,
    ReplayReviewSession,
    ReplayVideo,
    ReplayVideoLocalFileRequest,
    ReplayVideoYouTubeRequest,
    ReplayAnnotationClipUploadRequest,
    ReplayVideoImportCandidate,
    ReplayVideoUploadRequest,
    SharedReplayReviewResponse,
    PracticeTask,
    PracticeTaskStatus,
    StudyCard,
    StudyCardReviewResponse,
    StudyReviewRating,
    UpdateReplayAnnotationRequest,
    UpdateReplayReviewSessionRequest,
} from "@/src/types/replayLab";

export function useReplayLab() {
    const {request, loading} = useApi();

    const listVideos = React.useCallback(async (): Promise<ReplayVideo[]> => {
        return request(() => api.get("/replay-videos"));
    }, [request]);

    const uploadVideo = React.useCallback(async (payload: ReplayVideoUploadRequest): Promise<ReplayVideo> => {
        const formData = new FormData();
        formData.append("video", payload.video);
        if (typeof payload.fps === "number") {
            formData.append("fps", String(payload.fps));
        }

        return request(() => api.post("/replay-videos", formData, {
            headers: {"Content-Type": "multipart/form-data"},
        }));
    }, [request]);

    const createYouTubeVideo = React.useCallback(async (payload: ReplayVideoYouTubeRequest): Promise<ReplayVideo> => {
        return request(() => api.post("/replay-videos/youtube", payload));
    }, [request]);

    const createLocalFileVideo = React.useCallback(async (payload: ReplayVideoLocalFileRequest): Promise<ReplayVideo> => {
        return request(() => api.post("/replay-videos/local-file", payload));
    }, [request]);

    const listVideoImports = React.useCallback(async (): Promise<ReplayVideoImportCandidate[]> => {
        return request(() => api.get("/replay-video-imports"));
    }, [request]);

    const importVideo = React.useCallback(async (fileId: string, fps?: number | null, deleteSource = false): Promise<ReplayVideo> => {
        return request(() => api.post(`/replay-video-imports/${fileId}`, {fps, deleteSource}));
    }, [request]);

    const getReplayLabLimits = React.useCallback(async (): Promise<ReplayLabLimits> => {
        return request(() => api.get("/replay-lab/limits"));
    }, [request]);

    const createReviewSession = React.useCallback(async (payload: CreateReplayReviewSessionRequest): Promise<ReplayReviewSession> => {
        return request(() => api.post("/replay-review-sessions", payload));
    }, [request]);

    const listReviewSessions = React.useCallback(async (): Promise<ReplayReviewSession[]> => {
        return request(() => api.get("/replay-review-sessions"));
    }, [request]);

    const getReviewSession = React.useCallback(async (sessionId: string): Promise<ReplayReviewSession> => {
        return request(() => api.get(`/replay-review-sessions/${sessionId}`));
    }, [request]);

    const updateReviewSession = React.useCallback(async (sessionId: string, payload: UpdateReplayReviewSessionRequest): Promise<ReplayReviewSession> => {
        return request(() => api.patch(`/replay-review-sessions/${sessionId}`, payload));
    }, [request]);

    const deleteReviewSession = React.useCallback(async (sessionId: string): Promise<void> => {
        await request(() => api.delete(`/replay-review-sessions/${sessionId}`));
    }, [request]);

    const fetchVideoPlaybackBlob = React.useCallback(async (videoId: string): Promise<Blob> => {
        return request(() => api.get(`/replay-videos/${videoId}/playback`, {responseType: "blob"}));
    }, [request]);

    const fetchClipPlaybackBlob = React.useCallback(async (clipId: string): Promise<Blob> => {
        return request(() => api.get(`/replay-clips/${clipId}/playback`, {responseType: "blob"}));
    }, [request]);

    const listAnnotations = React.useCallback(async (sessionId: string): Promise<ReplayAnnotation[]> => {
        return request(() => api.get(`/replay-review-sessions/${sessionId}/annotations`));
    }, [request]);

    const createAnnotation = React.useCallback(async (sessionId: string, payload: CreateReplayAnnotationRequest): Promise<ReplayAnnotation> => {
        return request(() => api.post(`/replay-review-sessions/${sessionId}/annotations`, payload));
    }, [request]);

    const updateAnnotation = React.useCallback(async (annotationId: string, payload: UpdateReplayAnnotationRequest): Promise<ReplayAnnotation> => {
        return request(() => api.patch(`/replay-annotations/${annotationId}`, payload));
    }, [request]);

    const deleteAnnotation = React.useCallback(async (annotationId: string): Promise<void> => {
        await request(() => api.delete(`/replay-annotations/${annotationId}`));
    }, [request]);

    const saveReviewSession = React.useCallback(async (sessionId: string): Promise<ReplayReviewSession> => {
        return request(() => api.post(`/replay-review-sessions/${sessionId}/save`));
    }, [request]);

    const exportReviewSession = React.useCallback(async (sessionId: string): Promise<ReplayAnnotationExportResult> => {
        return request(() => api.post(`/replay-review-sessions/${sessionId}/export`));
    }, [request]);

    const uploadAnnotationClip = React.useCallback(async (annotationId: string, payload: ReplayAnnotationClipUploadRequest): Promise<void> => {
        const formData = new FormData();
        formData.append("clip", payload.clip, `${annotationId}.mp4`);
        formData.append("durationMs", String(payload.durationMs));

        await request(() => api.post(`/replay-annotations/${annotationId}/clip`, formData, {
            headers: {"Content-Type": "multipart/form-data"},
        }));
    }, [request]);

    const listPracticeTasks = React.useCallback(async (status: PracticeTaskStatus = "pending"): Promise<PracticeTask[]> => {
        return request(() => api.get("/practice-tasks", {params: {status}}));
    }, [request]);

    const completePracticeTask = React.useCallback(async (taskId: string): Promise<PracticeTask> => {
        return request(() => api.post(`/practice-tasks/${taskId}/complete`));
    }, [request]);

    const dismissPracticeTask = React.useCallback(async (taskId: string): Promise<PracticeTask> => {
        return request(() => api.post(`/practice-tasks/${taskId}/dismiss`));
    }, [request]);

    const listDueStudyCards = React.useCallback(async (): Promise<StudyCard[]> => {
        return request(() => api.get("/study/cards/due"));
    }, [request]);

    const reviewStudyCard = React.useCallback(async (cardId: string, rating: StudyReviewRating, wasCorrect: boolean): Promise<StudyCardReviewResponse> => {
        return request(() => api.post(`/study/cards/${cardId}/review`, {rating, wasCorrect}));
    }, [request]);

    const createShareLink = React.useCallback(async (sessionId: string, payload: CreateReplayReviewShareLinkRequest): Promise<ReplayReviewAccess> => {
        return request(() => api.post(`/replay-review-sessions/${sessionId}/share-links`, payload));
    }, [request]);

    const listShareLinks = React.useCallback(async (sessionId: string): Promise<ReplayReviewAccess[]> => {
        return request(() => api.get(`/replay-review-sessions/${sessionId}/share-links`));
    }, [request]);

    const revokeShareLink = React.useCallback(async (shareLinkId: string): Promise<ReplayReviewAccess> => {
        return request(() => api.post(`/share-links/${shareLinkId}/revoke`));
    }, [request]);

    const sharedReviewHeaders = React.useCallback((password?: string | null): Record<string, string> => {
        const trimmedPassword = password?.trim();

        return trimmedPassword ? {"X-Shared-Review-Password": trimmedPassword} : {};
    }, []);

    const getSharedReview = React.useCallback(async (token: string, password?: string | null): Promise<SharedReplayReviewResponse> => {
        return request(() => api.get(`/shared-review/${token}`, {headers: sharedReviewHeaders(password)}));
    }, [request, sharedReviewHeaders]);

    const fetchSharedReviewPlaybackBlob = React.useCallback(async (token: string, password?: string | null): Promise<Blob> => {
        return request(() => api.get(`/shared-review/${token}/playback`, {responseType: "blob", headers: sharedReviewHeaders(password)}));
    }, [request, sharedReviewHeaders]);

    const createSharedAnnotation = React.useCallback(async (token: string, payload: CreateReplayAnnotationRequest, password?: string | null): Promise<ReplayAnnotation> => {
        return request(() => api.post(`/shared-review/${token}/annotations`, payload, {headers: sharedReviewHeaders(password)}));
    }, [request, sharedReviewHeaders]);

    return {
        loading,
        listVideos,
        getReplayLabLimits,
        uploadVideo,
        createYouTubeVideo,
        createLocalFileVideo,
        listVideoImports,
        importVideo,
        createReviewSession,
        listReviewSessions,
        getReviewSession,
        updateReviewSession,
        deleteReviewSession,
        fetchVideoPlaybackBlob,
        fetchClipPlaybackBlob,
        listAnnotations,
        createAnnotation,
        updateAnnotation,
        deleteAnnotation,
        saveReviewSession,
        exportReviewSession,
        uploadAnnotationClip,
        listPracticeTasks,
        completePracticeTask,
        dismissPracticeTask,
        listDueStudyCards,
        reviewStudyCard,
        createShareLink,
        listShareLinks,
        revokeShareLink,
        getSharedReview,
        fetchSharedReviewPlaybackBlob,
        createSharedAnnotation,
    };
}
