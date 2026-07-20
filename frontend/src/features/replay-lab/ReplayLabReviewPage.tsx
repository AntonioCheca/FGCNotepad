import React from "react";
import {useReplayLab} from "@/hooks/useReplayLab";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {ReplayTimeline} from "@/src/features/replay-lab/ReplayTimeline";
import {ReplayVideoPlayer} from "@/src/features/replay-lab/ReplayVideoPlayer";
import {ReplayYouTubePlayer} from "@/src/features/replay-lab/ReplayYouTubePlayer";
import {formatUtcDateTime} from "@/src/utils/formatDateTime";
import {
    replayMemoryCategories,
    replayTaskCategories,
    type PracticeTaskScheduleType,
    type ReplayAnnotation,
    type ReplayAnnotationCategory,
    type ReplayAnnotationEventKind,
    type ReplayAnnotationExportResult,
    type ReplayLabLimits,
    type ReplayReviewAccess,
    type ReplayReviewSession,
    type ReplayVideo,
} from "@/src/types/replayLab";

type WorkflowMode = "local" | "coaching";

function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);

    return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function getErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as {response?: {data?: {message?: unknown}; status?: number}}).response;
        if (typeof response?.data?.message === "string") {
            return response.data.message;
        }
        if (typeof response?.status === "number") {
            return `Request failed with status ${response.status}.`;
        }
    }

    return error instanceof Error ? error.message : "Replay Lab request failed.";
}

function formatTimestamp(milliseconds: number): string {
    return `${(milliseconds / 1000).toFixed(3)}s`;
}

function isMp4File(file: File): boolean {
    return file.name.toLowerCase().endsWith(".mp4") || file.type === "video/mp4";
}

function humanizeCategory(category: string): string {
    return category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function categoriesFor(eventKind: ReplayAnnotationEventKind): readonly ReplayAnnotationCategory[] {
    return eventKind === "memory" ? replayMemoryCategories : replayTaskCategories;
}

function defaultCategory(eventKind: ReplayAnnotationEventKind): ReplayAnnotationCategory {
    return categoriesFor(eventKind)[0];
}

function workflowForVideo(video: ReplayVideo | null): WorkflowMode | null {
    if (!video) {
        return null;
    }

    return video.sourceType === "youtube" ? "coaching" : "local";
}

function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

export function ReplayLabReviewPage() {
    const {
        loading,
        getReplayLabLimits,
        createLocalFileVideo,
        createYouTubeVideo,
        createReviewSession,
        listReviewSessions,
        deleteReviewSession,
        fetchVideoPlaybackBlob,
        listAnnotations,
        createAnnotation,
        updateAnnotation,
        deleteAnnotation,
        saveReviewSession,
        exportReviewSession,
        createShareLink,
        listShareLinks,
        revokeShareLink,
    } = useReplayLab();

    const [sessions, setSessions] = React.useState<ReplayReviewSession[]>([]);
    const [selectedVideo, setSelectedVideo] = React.useState<ReplayVideo | null>(null);
    const [activeSession, setActiveSession] = React.useState<ReplayReviewSession | null>(null);
    const [workflowMode, setWorkflowMode] = React.useState<WorkflowMode | null>(null);
    const [annotations, setAnnotations] = React.useState<ReplayAnnotation[]>([]);
    const [localSourceFile, setLocalSourceFile] = React.useState<File | null>(null);
    const [youtubeUrl, setYoutubeUrl] = React.useState("");
    const [youtubeTitle, setYoutubeTitle] = React.useState("");
    const [playbackUrl, setPlaybackUrl] = React.useState<string | null>(null);
    const [playerLoading, setPlayerLoading] = React.useState(false);
    const [startingWorkflow, setStartingWorkflow] = React.useState<WorkflowMode | null>(null);
    const [playbackPosition, setPlaybackPosition] = React.useState({timeMs: 0, frame: 0, durationMs: 0});
    const [clipStartMs, setClipStartMs] = React.useState<number | null>(null);
    const [clipEndMs, setClipEndMs] = React.useState<number | null>(null);
    const [seekCommand, setSeekCommand] = React.useState<{id: number; timeMs: number} | null>(null);
    const [eventKind, setEventKind] = React.useState<ReplayAnnotationEventKind>("memory");
    const [category, setCategory] = React.useState<ReplayAnnotationCategory>(() => defaultCategory("memory"));
    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNotes, setAnnotationNotes] = React.useState("");
    const [annotationAnswer, setAnnotationAnswer] = React.useState("");
    const [taskScheduleType, setTaskScheduleType] = React.useState<PracticeTaskScheduleType>("once");
    const [taskOccurrences, setTaskOccurrences] = React.useState("1");
    const [taskDueDate, setTaskDueDate] = React.useState("");
    const [editingAnnotationId, setEditingAnnotationId] = React.useState<string | null>(null);
    const [exportResult, setExportResult] = React.useState<ReplayAnnotationExportResult | null>(null);
    const [exporting, setExporting] = React.useState(false);
    const [limits, setLimits] = React.useState<ReplayLabLimits | null>(null);
    const [shareLabel, setShareLabel] = React.useState("Coach review");
    const [shareExpiresAt, setShareExpiresAt] = React.useState("");
    const [sharePassword, setSharePassword] = React.useState("");
    const [shareLinks, setShareLinks] = React.useState<ReplayReviewAccess[]>([]);
    const [createdShareLink, setCreatedShareLink] = React.useState<ReplayReviewAccess | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [notice, setNotice] = React.useState<string | null>(null);

    const isEditorOpen = Boolean(activeSession && selectedVideo && workflowMode);

    const refreshSessions = React.useCallback(async () => {
        setSessions(await listReviewSessions());
    }, [listReviewSessions]);

    const refreshAnnotations = React.useCallback(async (sessionId: string) => {
        setAnnotations(await listAnnotations(sessionId));
    }, [listAnnotations]);

    const refreshShareLinks = React.useCallback(async (sessionId: string) => {
        setShareLinks(await listShareLinks(sessionId));
    }, [listShareLinks]);

    React.useEffect(() => {
        void refreshSessions().catch((caughtError: unknown) => setError(getErrorMessage(caughtError)));
        void getReplayLabLimits().then(setLimits).catch(() => undefined);
    }, [getReplayLabLimits, refreshSessions]);

    React.useEffect(() => {
        return () => {
            if (playbackUrl) {
                URL.revokeObjectURL(playbackUrl);
            }
        };
    }, [playbackUrl]);

    const clearSelection = () => {
        setClipStartMs(null);
        setClipEndMs(null);
    };

    const resetAnnotationForm = () => {
        clearSelection();
        setAnnotationTitle("");
        setAnnotationNotes("");
        setAnnotationAnswer("");
        setTaskScheduleType("once");
        setTaskOccurrences("1");
        setTaskDueDate("");
        setEditingAnnotationId(null);
    };

    const rememberExportSource = (sessionId: string, file: File) => {
        window.sessionStorage.setItem(`replayLab.export.${sessionId}`, JSON.stringify({filename: file.name, sizeBytes: file.size}));
    };

    const openEditor = async (session: ReplayReviewSession, video: ReplayVideo, mode: WorkflowMode, file: File | null) => {
        setSelectedVideo(video);
        setActiveSession(session);
        setWorkflowMode(mode);
        setAnnotations([]);
        setShareLinks([]);
        resetAnnotationForm();
        setExportResult(null);
        setCreatedShareLink(null);
        setPlayerLoading(true);

        if (file) {
            rememberExportSource(session.id, file);
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
            void refreshAnnotations(session.id).catch((caughtError: unknown) => setError(getErrorMessage(caughtError)));
            if (mode === "coaching") {
                void refreshShareLinks(session.id).catch(() => undefined);
            }
        } finally {
            setPlayerLoading(false);
        }
    };

    const startLocalReview = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!localSourceFile) {
            setError("Choose a local replay file before starting review.");
            return;
        }
        if (!isMp4File(localSourceFile)) {
            setError("Only MP4 files are supported. Convert MKV files to MP4 before review.");
            return;
        }

        setError(null);
        setNotice(null);
        setStartingWorkflow("local");
        try {
            const video = await createLocalFileVideo({filename: localSourceFile.name, sizeBytes: localSourceFile.size});
            const session = await createReviewSession({videoId: video.id, title: `Local review - ${localSourceFile.name}`});
            await openEditor(session, video, "local", localSourceFile);
            setNotice("Local review ready. The original file stays in your browser.");
            void refreshSessions().catch(() => undefined);
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        } finally {
            setStartingWorkflow(null);
        }
    };

    const startYouTubeReview = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!localSourceFile) {
            setError("Choose the matching local original file before starting a coaching review.");
            return;
        }
        if (!isMp4File(localSourceFile)) {
            setError("Only MP4 files are supported. Convert MKV files to MP4 before review.");
            return;
        }
        if (!youtubeUrl.trim()) {
            setError("Paste a YouTube URL or video ID before starting review.");
            return;
        }

        setError(null);
        setNotice(null);
        setStartingWorkflow("coaching");
        try {
            const video = await createYouTubeVideo({youtubeUrl, title: youtubeTitle || null});
            const session = await createReviewSession({videoId: video.id, title: youtubeTitle || `Coaching review - ${localSourceFile.name}`});
            setYoutubeUrl("");
            setYoutubeTitle("");
            await openEditor(session, video, "coaching", localSourceFile);
            setNotice("Coaching review ready. YouTube handles shared playback; local file is kept for export.");
            void refreshSessions().catch(() => undefined);
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        } finally {
            setStartingWorkflow(null);
        }
    };

    const openReviewSession = async (session: ReplayReviewSession) => {
        const video = session.video;
        if (!video) {
            setError("This review session no longer has replay source metadata.");
            return;
        }

        const mode = workflowForVideo(video);
        if (!mode) {
            setError("This review session has an unsupported source type.");
            return;
        }

        if (video.sourceType === "local_file" && (!localSourceFile || localSourceFile.name !== video.originalFilename)) {
            setError(`Select "${video.originalFilename}" first, then reopen this local review.`);
            return;
        }

        setError(null);
        setNotice(null);
        try {
            await openEditor(session, video, mode, localSourceFile);
            setNotice(`Opened ${session.title}.`);
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        }
    };

    const buildAnnotationNotes = (): string | null => {
        const baseNotes = annotationNotes.trim();
        if (eventKind !== "task") {
            return baseNotes || null;
        }

        const occurrenceCount = Math.max(1, Number.parseInt(taskOccurrences, 10) || 1);
        const scheduleLines = [
            "Replay Task Schedule",
            `Schedule: ${taskScheduleType}`,
            `Occurrences: ${occurrenceCount}`,
            taskDueDate ? `Due: ${taskDueDate}` : null,
        ].filter(Boolean);

        return [baseNotes, scheduleLines.join("\n")].filter(Boolean).join("\n\n");
    };

    const markClipStart = () => {
        setClipStartMs(playbackPosition.timeMs);
        if (clipEndMs !== null && clipEndMs <= playbackPosition.timeMs) {
            setClipEndMs(null);
        }
    };

    const markClipEnd = () => setClipEndMs(playbackPosition.timeMs);

    const editAnnotation = (annotation: ReplayAnnotation) => {
        setEditingAnnotationId(annotation.id);
        setClipStartMs(annotation.startTimeMs);
        setClipEndMs(annotation.endTimeMs);
        setEventKind(annotation.eventKind);
        setCategory(annotation.category);
        setAnnotationTitle(annotation.title ?? "");
        setAnnotationNotes(annotation.notes ?? "");
        setAnnotationAnswer(annotation.answer ?? "");
        setTaskScheduleType("once");
        setTaskOccurrences("1");
        setTaskDueDate("");
        setSeekCommand({id: Date.now(), timeMs: annotation.startTimeMs});
    };

    const submitAnnotation = async () => {
        if (!activeSession) {
            setError("Start a review before saving annotations.");
            return;
        }
        if (clipStartMs === null || clipEndMs === null || clipEndMs <= clipStartMs) {
            setError("Mark a valid start and end before saving.");
            return;
        }

        setError(null);
        setNotice(null);
        try {
            const payload = {
                startTimeMs: clipStartMs,
                endTimeMs: clipEndMs,
                eventKind,
                category,
                title: annotationTitle,
                notes: buildAnnotationNotes(),
                answer: eventKind === "memory" ? annotationAnswer : null,
            };
            if (editingAnnotationId) {
                await updateAnnotation(editingAnnotationId, payload);
            } else {
                await createAnnotation(activeSession.id, payload);
            }
            await refreshAnnotations(activeSession.id);
            resetAnnotationForm();
            setExportResult(null);
            setNotice(editingAnnotationId ? "Annotation updated." : "Annotation saved.");
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        }
    };

    const removeAnnotation = async (annotationId: string) => {
        if (!activeSession) {
            return;
        }

        setError(null);
        setNotice(null);
        try {
            await deleteAnnotation(annotationId);
            await refreshAnnotations(activeSession.id);
            setExportResult(null);
            setNotice("Annotation deleted.");
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        }
    };

    const removeSession = async (sessionId: string) => {
        setError(null);
        setNotice(null);
        try {
            await deleteReviewSession(sessionId);
            if (activeSession?.id === sessionId) {
                resetEditor();
            }
            await refreshSessions();
            setNotice("Draft deleted.");
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        }
    };

    const saveAndExport = async () => {
        if (!activeSession) {
            setError("Start a review before exporting.");
            return;
        }

        setError(null);
        setNotice(null);
        setExporting(true);
        try {
            await saveReviewSession(activeSession.id);
            if (selectedVideo?.sourceType === "youtube" || selectedVideo?.sourceType === "local_file") {
                window.location.assign(`/replay-lab/export?sessionId=${encodeURIComponent(activeSession.id)}`);
                return;
            }

            const result = await exportReviewSession(activeSession.id);
            setExportResult(result);
            await refreshAnnotations(activeSession.id);
            setNotice(result.failed > 0 ? "Export finished with failures." : "Review exported to practice and study queues.");
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        } finally {
            setExporting(false);
        }
    };

    const generateShareLink = async () => {
        if (!activeSession || workflowMode !== "coaching") {
            setError("Coach links are only available for Coaching Review.");
            return;
        }

        setError(null);
        setNotice(null);
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
            setNotice("Coach link created.");
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        }
    };

    const revokeCoachLink = async (shareLinkId: string) => {
        if (!activeSession) {
            return;
        }

        setError(null);
        setNotice(null);
        try {
            await revokeShareLink(shareLinkId);
            await refreshShareLinks(activeSession.id);
            setNotice("Coach link revoked.");
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        }
    };

    const resetEditor = () => {
        setActiveSession(null);
        setSelectedVideo(null);
        setWorkflowMode(null);
        setAnnotations([]);
        setShareLinks([]);
        setCreatedShareLink(null);
        setPlaybackPosition({timeMs: 0, frame: 0, durationMs: 0});
        setSeekCommand(null);
        setPlaybackUrl((current) => {
            if (current) {
                URL.revokeObjectURL(current);
            }
            return null;
        });
        resetAnnotationForm();
    };

    const handleEventKindChange = (nextEventKind: ReplayAnnotationEventKind) => {
        setEventKind(nextEventKind);
        setCategory(defaultCategory(nextEventKind));
    };

    const sharedReviewUrl = createdShareLink?.token && typeof window !== "undefined"
        ? `${window.location.origin}/replay-lab/shared/${createdShareLink.token}`
        : null;

    const clipDurationMs = clipStartMs !== null && clipEndMs !== null ? clipEndMs - clipStartMs : null;
    const canSaveAnnotation = Boolean(activeSession && clipDurationMs !== null && clipDurationMs > 0 && clipDurationMs <= 10000);
    const canExport = Boolean(activeSession && annotations.length > 0);
    const canMarkRange = Boolean(activeSession && selectedVideo && !playerLoading);
    const markStartRef = React.useRef(markClipStart);
    const markEndRef = React.useRef(markClipEnd);
    const submitAnnotationRef = React.useRef(submitAnnotation);
    const shortcutStateRef = React.useRef({canMarkRange, canSaveAnnotation, clipStartMs, isEditorOpen, loading});

    React.useEffect(() => {
        markStartRef.current = markClipStart;
        markEndRef.current = markClipEnd;
        submitAnnotationRef.current = submitAnnotation;
        shortcutStateRef.current = {canMarkRange, canSaveAnnotation, clipStartMs, isEditorOpen, loading};
    });

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const shortcutState = shortcutStateRef.current;

            if (!shortcutState.isEditorOpen || shouldIgnoreShortcut(event)) {
                return;
            }

            if (event.key.toLowerCase() === "i") {
                event.preventDefault();
                if (shortcutState.canMarkRange) {
                    markStartRef.current();
                }
                return;
            }

            if (event.key.toLowerCase() === "o") {
                event.preventDefault();
                if (shortcutState.canMarkRange) {
                    markEndRef.current();
                }
                return;
            }

            if (event.key.toLowerCase() === "g") {
                event.preventDefault();
                if (shortcutState.clipStartMs !== null) {
                    setSeekCommand({id: Date.now(), timeMs: shortcutState.clipStartMs});
                }
                return;
            }

            if (event.key.toLowerCase() === "s") {
                event.preventDefault();
                if (shortcutState.canSaveAnnotation && !shortcutState.loading) {
                    void submitAnnotationRef.current();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const markerControls = (
        <>
            <AppButton type="button" variant="outlined" disabled={!canMarkRange} onClick={markClipStart}>Set Start</AppButton>
            <AppButton type="button" variant="outlined" disabled={!canMarkRange} onClick={markClipEnd}>Set End</AppButton>
            <AppButton type="button" variant="outlined" disabled={clipStartMs === null} onClick={() => clipStartMs !== null && setSeekCommand({id: Date.now(), timeMs: clipStartMs})}>Go Start</AppButton>
        </>
    );
    const timeline = (
        <ReplayTimeline
            annotations={annotations}
            clipStartMs={clipStartMs}
            clipEndMs={clipEndMs}
            cursorMs={playbackPosition.timeMs}
            durationMs={playbackPosition.durationMs || selectedVideo?.durationMs || 0}
            onSeek={(timeMs) => setSeekCommand({id: Date.now(), timeMs})}
        />
    );

    return (
        <PageShell
            title="Replay Lab"
            subtitle={isEditorOpen ? activeSession?.title ?? "Review editor" : "Choose one workflow. Local files stay in your browser; only short exported clips are uploaded."}
            badgeLabel={workflowMode === "coaching" ? "Coaching Review" : workflowMode === "local" ? "Local Review" : "Review Replays"}
        >
            <AppStack spacing={1.5}>
                {error ? <AppAlert severity="error" onClose={() => setError(null)}>{error}</AppAlert> : null}
                {notice ? <AppAlert severity="success" onClose={() => setNotice(null)}>{notice}</AppAlert> : null}
                {!isEditorOpen ? (
                    <AppBox sx={{display: "grid", gap: 1.5}}>
                        <SectionCard title="Choose source file" description="Required for both Local Review and Coaching Review." tone="raised" variant="input">
                            <AppStack spacing={1.1}>
                                {limits ? <AppAlert severity="info">Exports are limited to {limits.maxClipDurationSeconds}s clips. Original videos are not uploaded.</AppAlert> : null}
                                <AppStack direction={{xs: "column", sm: "row"}} spacing={1} alignItems={{xs: "stretch", sm: "center"}}>
                                    <AppButton type="button" component="label" variant="outlined">
                                        Select Local MP4
                                        <input hidden type="file" accept="video/mp4,.mp4" onChange={(event) => setLocalSourceFile(event.target.files?.[0] ?? null)} />
                                    </AppButton>
                                    <AppTypography color="text.secondary">
                                        {localSourceFile ? `${localSourceFile.name} (${formatBytes(localSourceFile.size)})` : "No local source selected"}
                                    </AppTypography>
                                </AppStack>
                            </AppStack>
                        </SectionCard>

                        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", lg: "1fr 1fr"}, gap: 1.5}}>
                            <SectionCard title="Local Review" description="Solo review from the selected local file." tone="raised" variant="review">
                                <AppBox component="form" onSubmit={startLocalReview} sx={{display: "grid", gap: 1}}>
                                    <AppTypography color="text.secondary">Use this when you do not need a coach link. Playback and export both use the local source.</AppTypography>
                                    <AppButton type="submit" disabled={loading || !localSourceFile || startingWorkflow !== null}>
                                        {startingWorkflow === "local" ? "Opening..." : "Start Local Review"}
                                    </AppButton>
                                </AppBox>
                            </SectionCard>

                            <SectionCard title="Coaching Review" description="YouTube playback for review, local file for export." tone="raised" variant="input">
                                <AppBox component="form" onSubmit={startYouTubeReview} sx={{display: "grid", gap: 1}}>
                                    <AppTextField label="YouTube URL or video ID" value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} />
                                    <AppTextField label="Review title" value={youtubeTitle} onChange={(event) => setYoutubeTitle(event.target.value)} placeholder="Optional" />
                                    <AppButton type="submit" disabled={loading || !localSourceFile || !youtubeUrl.trim() || startingWorkflow !== null}>
                                        {startingWorkflow === "coaching" ? "Opening..." : "Start Coaching Review"}
                                    </AppButton>
                                </AppBox>
                            </SectionCard>
                        </AppBox>

                        <SectionCard title="Resume draft" description="For local-only drafts, select the matching local file before reopening." tone="sunken" variant="finalize">
                            <AppStack spacing={1}>
                                {sessions.length === 0 ? <AppTypography color="text.secondary">No review drafts yet.</AppTypography> : null}
                                {sessions.map((session) => {
                                    const video = session.video;
                                    const label = video?.sourceType === "youtube" ? "Coaching" : video?.sourceType === "local_file" ? "Local" : "Legacy";

                                    return (
                                        <AppBox key={session.id} sx={(theme) => ({display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr auto"}, gap: 1, alignItems: "center", p: 1, border: "1px solid", borderColor: theme.fgc.border.default, borderRadius: 1.25, backgroundColor: theme.fgc.surface.base})}>
                                            <AppBox>
                                                <AppTypography variant="subtitle2">{session.title}</AppTypography>
                                                <AppTypography variant="body2" color="text.secondary">{label}{video ? ` - ${video.originalFilename}` : ""} - Updated {formatUtcDateTime(session.updatedAt, "No expiry")}</AppTypography>
                                            </AppBox>
                                            <AppStack direction="row" spacing={0.75} justifyContent={{xs: "flex-start", md: "flex-end"}} flexWrap="wrap" useFlexGap>
                                                <AppButton type="button" variant="outlined" onClick={() => void openReviewSession(session)} disabled={loading || !video || session.status === "archived"}>Open</AppButton>
                                                <AppButton type="button" variant="outlined" color="error" onClick={() => void removeSession(session.id)} disabled={loading || session.status === "saved"}>Delete Draft</AppButton>
                                            </AppStack>
                                        </AppBox>
                                    );
                                })}
                            </AppStack>
                        </SectionCard>
                    </AppBox>
                ) : (
                    <AppBox sx={{display: "grid", gap: 1.5}}>
                        <AppStack direction={{xs: "column", md: "row"}} spacing={1} alignItems={{xs: "stretch", md: "center"}} justifyContent="space-between">
                            <AppBox>
                                <AppTypography variant="h6">{activeSession?.title}</AppTypography>
                                <AppTypography color="text.secondary">{workflowMode === "coaching" ? "Coaching Review: YouTube playback, local export source." : "Local Review: browser playback, local export source."}</AppTypography>
                            </AppBox>
                            <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                <AppButton type="button" variant="outlined" onClick={resetEditor}>Change Workflow</AppButton>
                                <AppButton type="button" disabled={!canExport || loading || exporting} onClick={() => void saveAndExport()}>{exporting ? "Preparing..." : "Export Clips"}</AppButton>
                            </AppStack>
                        </AppStack>

                        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", lg: "minmax(0, 0.9fr) minmax(340px, 420px)", xl: "minmax(0, 0.86fr) 440px"}, gap: 1, alignItems: "start"}}>
                            <AppBox
                                sx={(theme) => ({
                                    display: "grid",
                                    gap: 0.7,
                                    px: {xs: 0, md: 0.5},
                                    py: {xs: 0, md: 0.25},
                                    borderRadius: 1.5,
                                    backgroundColor: theme.fgc.surface.base,
                                })}
                            >
                                {playerLoading ? <AppAlert severity="info">Loading player...</AppAlert> : null}
                                {selectedVideo?.sourceType === "youtube" ? (
                                    <ReplayYouTubePlayer videoId={selectedVideo.youtubeVideoId} fps={60} title={selectedVideo.originalFilename} seekCommand={seekCommand} onPlaybackPositionChange={setPlaybackPosition} timelineAddon={timeline} controlsAddon={markerControls} />
                                ) : (
                                    <ReplayVideoPlayer src={playbackUrl} title={selectedVideo?.originalFilename ?? "Replay playback"} seekCommand={seekCommand} onPlaybackPositionChange={setPlaybackPosition} timelineAddon={timeline} controlsAddon={markerControls} />
                                )}
                                <AppTypography variant="body2" color="text.secondary" sx={{width: {xs: "100%", md: "82%"}, mx: "auto"}}>Mark: I start, O end, G go start, S save.</AppTypography>
                            </AppBox>

                            <AppStack spacing={1} sx={{maxHeight: {lg: "calc(100vh - 190px)"}, overflow: {lg: "auto"}, pr: {lg: 0.25}}}>
                                <SectionCard title="Annotation" description="Mark, describe, save." tone="raised" variant="input">
                                    <AppStack spacing={0.75}>
                                        <AppTypography variant="body2" color={clipDurationMs !== null && clipDurationMs > 10000 ? "error" : "text.secondary"}>
                                            {clipStartMs === null ? "Start unset" : `Start ${formatTimestamp(clipStartMs)}`} - {clipEndMs === null ? "End unset" : `End ${formatTimestamp(clipEndMs)}`} - {clipDurationMs === null ? "No duration" : formatTimestamp(Math.max(0, clipDurationMs))}
                                        </AppTypography>
                                        <AppBox sx={{display: "grid", gridTemplateColumns: "0.72fr 1fr", gap: 0.75}}>
                                            <AppTextField select label="Type" value={eventKind} onChange={(event) => handleEventKindChange(event.target.value as ReplayAnnotationEventKind)}>
                                                <AppMenuItem value="memory">Memory</AppMenuItem>
                                                <AppMenuItem value="task">Task</AppMenuItem>
                                            </AppTextField>
                                            <AppTextField select label="Category" value={category} onChange={(event) => setCategory(event.target.value as ReplayAnnotationCategory)}>
                                                {categoriesFor(eventKind).map((item) => <AppMenuItem key={item} value={item}>{humanizeCategory(item)}</AppMenuItem>)}
                                            </AppTextField>
                                        </AppBox>
                                        <AppTextField label={eventKind === "memory" ? "Prompt" : "Task"} value={annotationTitle} onChange={(event) => setAnnotationTitle(event.target.value)} />
                                        <AppTextField label="Notes" value={annotationNotes} onChange={(event) => setAnnotationNotes(event.target.value)} multiline minRows={1} />
                                        {eventKind === "memory" ? <AppTextField label="Answer" value={annotationAnswer} onChange={(event) => setAnnotationAnswer(event.target.value)} /> : null}
                                        {eventKind === "task" ? (
                                            <AppBox sx={{display: "grid", gridTemplateColumns: "1fr 86px", gap: 0.75}}>
                                                <AppTextField select label="Schedule" value={taskScheduleType} onChange={(event) => setTaskScheduleType(event.target.value as PracticeTaskScheduleType)}>
                                                    <AppMenuItem value="once">Once</AppMenuItem>
                                                    <AppMenuItem value="daily_for_n_days">Daily</AppMenuItem>
                                                    <AppMenuItem value="weekly">Weekly</AppMenuItem>
                                                    <AppMenuItem value="custom">Custom</AppMenuItem>
                                                </AppTextField>
                                                <AppTextField label="Reps" value={taskOccurrences} onChange={(event) => setTaskOccurrences(event.target.value)} inputProps={{inputMode: "numeric"}} />
                                                <AppTextField label="First due" type="datetime-local" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} InputLabelProps={{shrink: true}} sx={{gridColumn: "1 / -1"}} />
                                            </AppBox>
                                        ) : null}
                                        <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                            <AppButton type="button" disabled={!canSaveAnnotation || loading} onClick={() => void submitAnnotation()}>{editingAnnotationId ? "Update" : "Save"}</AppButton>
                                            <AppButton type="button" variant="outlined" color="secondary" onClick={clearSelection}>Clear</AppButton>
                                            {editingAnnotationId ? <AppButton type="button" variant="outlined" color="secondary" onClick={resetAnnotationForm}>Cancel</AppButton> : null}
                                        </AppStack>
                                    </AppStack>
                                </SectionCard>

                                <SectionCard title="Saved" description={`${annotations.length} marked clips.`} tone="sunken" variant="finalize">
                                    <AppStack spacing={0.75}>
                                        {exportResult ? <AppAlert severity={exportResult.failed > 0 ? "warning" : "success"}>Export summary: {exportResult.clipsCreated} clips, {exportResult.tasksCreated} tasks, {exportResult.studyCardsCreated} cards, {exportResult.failed} failed.</AppAlert> : null}
                                        {annotations.length === 0 ? <AppTypography color="text.secondary">No annotations yet.</AppTypography> : null}
                                        {annotations.map((annotation) => (
                                            <AppBox key={annotation.id} sx={(theme) => ({display: "grid", gap: 0.5, p: 0.75, border: "1px solid", borderColor: annotation.exportedClip ? theme.fgc.border.strong : theme.fgc.border.default, borderRadius: 1.25, backgroundColor: theme.fgc.surface.base})}>
                                                <AppStack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                    {annotation.exportedClip ? <AppChip size="small" color="success" label="Exported" /> : null}
                                                    <AppChip size="small" variant="outlined" label={`${formatTimestamp(annotation.startTimeMs)} - ${formatTimestamp(annotation.endTimeMs)}`} />
                                                </AppStack>
                                                <AppTypography variant="subtitle2">{annotation.title || humanizeCategory(annotation.category)}</AppTypography>
                                                {annotation.exportError ? <AppTypography variant="caption" color="error">{annotation.exportError}</AppTypography> : null}
                                                <AppStack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                    <AppButton type="button" variant="outlined" size="small" onClick={() => setSeekCommand({id: Date.now(), timeMs: annotation.startTimeMs})}>Go</AppButton>
                                                    <AppButton type="button" variant="outlined" size="small" disabled={Boolean(annotation.exportedClip)} onClick={() => editAnnotation(annotation)}>Edit</AppButton>
                                                    <AppButton type="button" variant="outlined" color="error" size="small" disabled={Boolean(annotation.exportedClip)} onClick={() => void removeAnnotation(annotation.id)}>Delete</AppButton>
                                                </AppStack>
                                            </AppBox>
                                        ))}
                                    </AppStack>
                                </SectionCard>
                            </AppStack>
                        </AppBox>

                        {workflowMode === "coaching" ? (
                            <SectionCard title="Coach link" description="Optional. Share this review with a coach after the YouTube video is loaded." tone="sunken" variant="finalize">
                                <AppStack spacing={1}>
                                    <AppStack direction={{xs: "column", md: "row"}} spacing={1} alignItems={{xs: "stretch", md: "center"}}>
                                        <AppTextField label="Label" value={shareLabel} onChange={(event) => setShareLabel(event.target.value)} sx={{maxWidth: {md: 240}}} />
                                        <AppTextField label="Expires at" type="datetime-local" value={shareExpiresAt} onChange={(event) => setShareExpiresAt(event.target.value)} InputLabelProps={{shrink: true}} sx={{maxWidth: {md: 240}}} />
                                        <AppTextField label="Optional password" type="password" value={sharePassword} onChange={(event) => setSharePassword(event.target.value)} sx={{maxWidth: {md: 220}}} />
                                        <AppButton type="button" variant="outlined" onClick={() => void generateShareLink()} disabled={loading}>Create Link</AppButton>
                                    </AppStack>
                                    {sharedReviewUrl ? <AppAlert severity="info">Coach link: {sharedReviewUrl}{createdShareLink?.requiresPassword ? " - password required" : ""}</AppAlert> : null}
                                    {shareLinks.map((link) => (
                                        <AppBox key={link.id} sx={(theme) => ({display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr auto"}, gap: 1, alignItems: "center", p: 1, border: "1px solid", borderColor: theme.fgc.border.default, borderRadius: 1.25, backgroundColor: theme.fgc.surface.base})}>
                                            <AppTypography variant="body2">{link.label || "Coach link"} - {link.revokedAt ? "Revoked" : "Active"}</AppTypography>
                                            <AppButton type="button" variant="outlined" color="error" size="small" disabled={Boolean(link.revokedAt) || loading} onClick={() => void revokeCoachLink(link.id)}>Revoke</AppButton>
                                        </AppBox>
                                    ))}
                                </AppStack>
                            </SectionCard>
                        ) : null}

                    </AppBox>
                )}
            </AppStack>
        </PageShell>
    );
}
