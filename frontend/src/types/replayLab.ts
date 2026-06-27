export type ReplayVideoStatus = "uploaded" | "processing" | "ready" | "failed" | "expired" | "deleted";
export type ReplayVideoSourceType = "upload" | "local_import" | "local_file" | "youtube";
export type ReplayReviewSessionStatus = "draft" | "saved" | "archived";
export type ReplayAnnotationEventKind = "memory" | "task";
export type ReplayClipStatus = "pending" | "processing" | "ready" | "failed" | "deleted";
export type PracticeTaskStatus = "pending" | "done" | "dismissed";
export type PracticeTaskScheduleType = "once" | "daily_for_n_days" | "weekly" | "custom";
export type StudyReviewRating = "again" | "hard" | "good" | "easy";

export const replayMemoryCategories = [
    "frame_trap",
    "spacing_trap",
    "negative_on_block",
    "reactable_gap",
    "non_reactable_gap_rps",
    "bad_oki_defense_choice",
    "custom_memory",
] as const;

export const replayTaskCategories = [
    "dropped_combo",
    "missing_input",
    "mistimed_oki",
    "missed_anti_air",
    "custom_task",
] as const;

export type ReplayMemoryCategory = typeof replayMemoryCategories[number];
export type ReplayTaskCategory = typeof replayTaskCategories[number];
export type ReplayAnnotationCategory = ReplayMemoryCategory | ReplayTaskCategory;

export interface ReplayVideo {
    id: string;
    sourceType: ReplayVideoSourceType;
    originalFilename: string;
    youtubeVideoId: string | null;
    youtubeUrl: string | null;
    mimeType: string;
    sizeBytes: number;
    durationMs: number;
    fps: number | null;
    status: ReplayVideoStatus;
    deleteAfter: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ReplayReviewSession {
    id: string;
    video: ReplayVideo | null;
    ownerUserId: string;
    createdByUserId: string;
    title: string;
    status: ReplayReviewSessionStatus;
    createdAt: string;
    updatedAt: string;
}

export interface ReplayClip {
    id: string;
    sourceVideoId: string | null;
    sourceAnnotationId: string;
    mimeType: string;
    sizeBytes: number;
    durationMs: number;
    startTimeMs: number;
    endTimeMs: number;
    startFrame: number | null;
    endFrame: number | null;
    status: ReplayClipStatus;
}

export interface ReplayAnnotation {
    id: string;
    sessionId: string;
    createdByUserId: string;
    startTimeMs: number;
    endTimeMs: number;
    startFrame: number | null;
    endFrame: number | null;
    eventKind: ReplayAnnotationEventKind;
    category: ReplayAnnotationCategory;
    title: string | null;
    notes: string | null;
    answer: string | null;
    exportedClip: ReplayClip | null;
    exportError: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateReplayAnnotationRequest {
    startTimeMs: number;
    endTimeMs: number;
    startFrame?: number | null;
    endFrame?: number | null;
    eventKind: ReplayAnnotationEventKind;
    category: ReplayAnnotationCategory;
    title?: string | null;
    notes?: string | null;
    answer?: string | null;
}

export type UpdateReplayAnnotationRequest = Partial<CreateReplayAnnotationRequest>;

export interface UpdateReplayReviewSessionRequest {
    title?: string;
    status?: ReplayReviewSessionStatus;
}

export interface ReplayAnnotationExportResult {
    clipsCreated: number;
    tasksCreated: number;
    studyCardsCreated: number;
    skipped: number;
    failed: number;
    errors: Array<{annotationId: string; error: string}>;
}

export interface PracticeTask {
    id: string;
    title: string;
    description: string;
    category: ReplayAnnotationCategory;
    status: PracticeTaskStatus;
    dueDate: string | null;
    scheduleType: PracticeTaskScheduleType;
    remainingOccurrences: number;
    completedOccurrences: number;
    completedAt: string | null;
    clip: ReplayClip | null;
    createdAt: string;
    updatedAt: string;
}

export interface ReplayLabLimits {
    maxReplaySizeBytes: number;
    maxReplayDurationSeconds: number;
    maxTemporaryReplaysPerUser: number;
    maxTemporaryReplayStorageBytesPerUser: number;
    maxClipDurationSeconds: number;
    maxClipsPerUser: number;
    maxClipStorageBytesPerUser: number;
}

export interface ReplayVideoImportCandidate {
    id: string;
    filename: string;
    sizeBytes: number;
    mimeType: string;
    modifiedAt: string;
}

export interface StudyCard {
    id: string;
    frontType: "video_clip" | string;
    prompt: string;
    category: ReplayAnnotationCategory;
    dueAt: string;
    intervalDays: number;
    repetitionCount: number;
    lapseCount: number;
    clip: ReplayClip | null;
    correctAnswer?: string;
}

export interface StudyCardReviewResponse {
    card: StudyCard & {correctAnswer: string};
    review: {
        id: string;
        rating: StudyReviewRating;
        wasCorrect: boolean;
        previousDueAt: string;
        nextDueAt: string;
    };
}

export interface ReplayReviewAccess {
    id: string;
    sessionId: string;
    label: string | null;
    expiresAt: string | null;
    maxUses: number | null;
    usedCount: number;
    canView: boolean;
    canAnnotate: boolean;
    requiresPassword: boolean;
    createdAt: string;
    revokedAt: string | null;
    token?: string;
}

export interface CreateReplayReviewShareLinkRequest {
    label?: string | null;
    expiresAt?: string | null;
    maxUses?: number | null;
    canView?: boolean;
    canAnnotate?: boolean;
    password?: string | null;
}

export interface SharedReplayReviewResponse {
    session: ReplayReviewSession;
    annotations: ReplayAnnotation[];
    access: ReplayReviewAccess;
}

export interface ReplayVideoUploadRequest {
    video: File;
    fps?: number | null;
}

export interface ReplayVideoYouTubeRequest {
    youtubeUrl: string;
    title?: string | null;
    fps?: number | null;
}

export interface ReplayVideoLocalFileRequest {
    filename: string;
    sizeBytes: number;
    fps?: number | null;
}

export interface CreateReplayReviewSessionRequest {
    videoId: string;
    title?: string;
}

export interface ReplayAnnotationClipUploadRequest {
    clip: Blob;
    durationMs: number;
}
