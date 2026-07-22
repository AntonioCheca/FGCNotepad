import React from "react";
import {useRouter} from "next/router";
import {useReplayLab} from "@/hooks/useReplayLab";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppDivider} from "@/src/components/ui/AppDivider";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {ReplayVideoPlayer} from "@/src/features/replay-lab/ReplayVideoPlayer";
import {ReplayYouTubePlayer} from "@/src/features/replay-lab/ReplayYouTubePlayer";
import {
    replayMemoryCategories,
    replayTaskCategories,
    type ReplayAnnotation,
    type ReplayAnnotationCategory,
    type ReplayAnnotationEventKind,
    type SharedReplayReviewResponse,
} from "@/src/types/replayLab";

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

    return error instanceof Error ? error.message : "Shared review request failed.";
}

function humanizeCategory(category: string): string {
    return category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTimestamp(milliseconds: number): string {
    return `${(milliseconds / 1000).toFixed(3)}s`;
}

function categoriesFor(eventKind: ReplayAnnotationEventKind): readonly ReplayAnnotationCategory[] {
    return eventKind === "memory" ? replayMemoryCategories : replayTaskCategories;
}

function defaultCategory(eventKind: ReplayAnnotationEventKind): ReplayAnnotationCategory {
    return categoriesFor(eventKind)[0];
}

interface AnnotationDraftState {
    clipStartMs: number | null;
    clipEndMs: number | null;
    eventKind: ReplayAnnotationEventKind;
    category: ReplayAnnotationCategory;
    title: string;
}

type AnnotationDraftAction =
    | {type: "setClipStart"; timeMs: number}
    | {type: "setClipEnd"; timeMs: number}
    | {type: "clearSelection"}
    | {type: "setEventKind"; eventKind: ReplayAnnotationEventKind}
    | {type: "setCategory"; category: ReplayAnnotationCategory}
    | {type: "setTitle"; title: string}
    | {type: "resetAfterSubmit"};

const INITIAL_ANNOTATION_DRAFT: AnnotationDraftState = {
    clipStartMs: null,
    clipEndMs: null,
    eventKind: "memory",
    category: defaultCategory("memory"),
    title: "",
};

function annotationDraftReducer(state: AnnotationDraftState, action: AnnotationDraftAction): AnnotationDraftState {
    switch (action.type) {
        case "setClipStart":
            return {...state, clipStartMs: action.timeMs};
        case "setClipEnd":
            return {...state, clipEndMs: action.timeMs};
        case "clearSelection":
            return {...state, clipStartMs: null, clipEndMs: null};
        case "setEventKind":
            return {...state, eventKind: action.eventKind, category: defaultCategory(action.eventKind)};
        case "setCategory":
            return {...state, category: action.category};
        case "setTitle":
            return {...state, title: action.title};
        case "resetAfterSubmit":
            return {...state, clipStartMs: null, clipEndMs: null, title: ""};
    }
}

export function ReplayLabSharedReviewPage() {
    const router = useRouter();
    const token = typeof router.query.token === "string" ? router.query.token : null;
    const {loading, getSharedReview, fetchSharedReviewPlaybackBlob, createSharedAnnotation} = useReplayLab();
    const [review, setReview] = React.useState<SharedReplayReviewResponse | null>(null);
    const [annotations, setAnnotations] = React.useState<ReplayAnnotation[]>([]);
    const [playbackUrl, setPlaybackUrl] = React.useState<string | null>(null);
    const [playbackPosition, setPlaybackPosition] = React.useState({timeMs: 0, frame: 0, durationMs: 0});
    const [seekCommand, setSeekCommand] = React.useState<{id: number; timeMs: number} | null>(null);
    const [annotationDraft, dispatchAnnotationDraft] = React.useReducer(annotationDraftReducer, INITIAL_ANNOTATION_DRAFT);
    const [sharedPassword, setSharedPassword] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const [notice, setNotice] = React.useState<string | null>(null);
    const {clipStartMs, clipEndMs, eventKind, category, title} = annotationDraft;

    const loadSharedReview = React.useCallback(async (password?: string | null) => {
        if (!token) {
            return;
        }
        const payload = await getSharedReview(token, password);
        const video = payload.session.video;
        const blob = !video || video.sourceType === "youtube" || video.sourceType === "local_file" ? null : await fetchSharedReviewPlaybackBlob(token, password);
        setPlaybackUrl((current) => {
            if (current) {
                URL.revokeObjectURL(current);
            }
            return blob ? URL.createObjectURL(blob) : null;
        });
        setReview(payload);
        setAnnotations(payload.annotations);
    }, [fetchSharedReviewPlaybackBlob, getSharedReview, token]);

    React.useEffect(() => {
        void loadSharedReview().catch((caughtError: unknown) => setError(getErrorMessage(caughtError)));
    }, [loadSharedReview]);

    React.useEffect(() => {
        return () => {
            if (playbackUrl) {
                URL.revokeObjectURL(playbackUrl);
            }
        };
    }, [playbackUrl]);

    const handleEventKindChange = (nextEventKind: ReplayAnnotationEventKind) => {
        dispatchAnnotationDraft({type: "setEventKind", eventKind: nextEventKind});
    };

    const clearSelection = () => {
        dispatchAnnotationDraft({type: "clearSelection"});
    };

    const submitAnnotation = async () => {
        if (!token) {
            setError("Shared review token is missing.");
            return;
        }
        if (clipStartMs === null || clipEndMs === null || clipEndMs <= clipStartMs) {
            setError("Mark a valid clip start and end before saving.");
            return;
        }

        setError(null);
        setNotice(null);
        try {
            await createSharedAnnotation(token, {
                startTimeMs: clipStartMs,
                endTimeMs: clipEndMs,
                startFrame: Math.round((clipStartMs / 1000) * (review?.session.video?.fps ?? 60)),
                endFrame: Math.round((clipEndMs / 1000) * (review?.session.video?.fps ?? 60)),
                eventKind,
                category,
                title: eventKind === "task" ? title : "",
                notes: null,
                answer: null,
            }, sharedPassword);
            const payload = await getSharedReview(token, sharedPassword);
            setReview(payload);
            setAnnotations(payload.annotations);
            dispatchAnnotationDraft({type: "resetAfterSubmit"});
            setNotice("Annotation proposal saved for the owner.");
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        }
    };

    const clipDurationMs = clipStartMs !== null && clipEndMs !== null ? clipEndMs - clipStartMs : null;
    const canSaveAnnotation = Boolean(review?.access.canAnnotate && clipDurationMs !== null && clipDurationMs > 0 && clipDurationMs <= 10000);

    return (
        <PageShell
            title="Shared Replay Review"
            subtitle="Review the owner’s replay and propose clip tags. Only the owner can export tasks or study cards."
            badgeLabel="Coach Link"
        >
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", xl: "1.1fr 0.9fr"}, gap: 1.5}}>
                <SectionCard
                    title={review?.session.title ?? "Loading shared review"}
                    tone="raised"
                    variant="review"
                >
                    <AppStack spacing={1.1}>
                        {error ? <AppAlert severity="error" onClose={() => setError(null)}>{error}</AppAlert> : null}
                        {notice ? <AppAlert severity="success" onClose={() => setNotice(null)}>{notice}</AppAlert> : null}
                        {error || review?.access.requiresPassword ? (
                            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "minmax(220px, 320px) auto"}, gap: 1, alignItems: "center"}}>
                                <AppTextField
                                    label="Shared review password"
                                    type="password"
                                    value={sharedPassword}
                                    onChange={(event) => setSharedPassword(event.target.value)}
                                />
                                <AppButton type="button" variant="outlined" disabled={!token || loading} onClick={() => {
                                    setError(null);
                                    void loadSharedReview(sharedPassword).catch((caughtError: unknown) => setError(getErrorMessage(caughtError)));
                                }}>
                                    Unlock Review
                                </AppButton>
                            </AppBox>
                        ) : null}
                        {!review && loading ? <AppTypography color="text.secondary">Loading shared review...</AppTypography> : null}
                        {review?.session.video?.sourceType === "local_file" ? (
                            <AppAlert severity="warning">This local-only review cannot be played from a coach link. Use the Coaching Review workflow with a YouTube link for shared playback.</AppAlert>
                        ) : review?.session.video?.sourceType === "youtube" ? (
                            <ReplayYouTubePlayer
                                videoId={review.session.video.youtubeVideoId}
                                fps={review.session.video.fps ?? 60}
                                title={review.session.title}
                                seekCommand={seekCommand}
                                onPlaybackPositionChange={setPlaybackPosition}
                            />
                        ) : (
                            <ReplayVideoPlayer
                                src={playbackUrl}
                                fps={review?.session.video?.fps ?? 60}
                                title={review?.session.title ?? "Shared replay playback"}
                                seekCommand={seekCommand}
                                onPlaybackPositionChange={setPlaybackPosition}
                            />
                        )}
                        <AppDivider />
                        <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <AppChip label={`Cursor ${formatTimestamp(playbackPosition.timeMs)}`} size="small" />
                            <AppChip label={`Frame ~${playbackPosition.frame}`} size="small" variant="outlined" />
                            <AppButton type="button" variant="outlined" disabled={!review} onClick={() => dispatchAnnotationDraft({type: "setClipStart", timeMs: playbackPosition.timeMs})}>Mark Start</AppButton>
                            <AppButton type="button" variant="outlined" disabled={!review} onClick={() => dispatchAnnotationDraft({type: "setClipEnd", timeMs: playbackPosition.timeMs})}>Mark End</AppButton>
                            <AppButton type="button" variant="outlined" disabled={clipStartMs === null} onClick={() => clipStartMs !== null && setSeekCommand({id: Date.now(), timeMs: clipStartMs})}>Go Start</AppButton>
                            <AppButton type="button" variant="outlined" color="secondary" onClick={clearSelection}>Clear</AppButton>
                        </AppStack>
                        <AppAlert severity={clipDurationMs !== null && clipDurationMs > 10000 ? "warning" : "info"}>
                            Start {clipStartMs === null ? "unset" : formatTimestamp(clipStartMs)} · End {clipEndMs === null ? "unset" : formatTimestamp(clipEndMs)} · Max 10.000s
                        </AppAlert>
                        {review?.access.canAnnotate ? (
                            <AppBox sx={{display: "grid", gap: 1}}>
                                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "160px 1fr"}, gap: 1}}>
                                    <AppTextField select label="Clip kind" value={eventKind} onChange={(event) => handleEventKindChange(event.target.value as ReplayAnnotationEventKind)}>
                                        <AppMenuItem value="memory">Memory Flashcard</AppMenuItem>
                                        <AppMenuItem value="task">Task</AppMenuItem>
                                    </AppTextField>
                                    <AppTextField select label={eventKind === "memory" ? "Flashcard answer" : "Task type"} value={category} onChange={(event) => dispatchAnnotationDraft({type: "setCategory", category: event.target.value as ReplayAnnotationCategory})}>
                                        {categoriesFor(eventKind).map((item) => <AppMenuItem key={item} value={item}>{humanizeCategory(item)}</AppMenuItem>)}
                                    </AppTextField>
                                </AppBox>
                                {eventKind === "task" ? <AppTextField label="Task title" value={title} onChange={(event) => dispatchAnnotationDraft({type: "setTitle", title: event.target.value})} /> : null}
                                <AppButton type="button" disabled={!canSaveAnnotation || loading} onClick={() => void submitAnnotation()}>
                                    Save Proposal
                                </AppButton>
                            </AppBox>
                        ) : <AppAlert severity="warning">This shared link is view-only.</AppAlert>}
                    </AppStack>
                </SectionCard>

                <SectionCard
                    title="Existing annotations"
                    tone="sunken"
                    variant="finalize"
                >
                    <AppStack spacing={1}>
                        {annotations.length === 0 ? <AppTypography color="text.secondary">No annotations yet.</AppTypography> : null}
                        {annotations.map((annotation) => (
                            <AppBox
                                key={annotation.id}
                                sx={(theme) => ({
                                    display: "grid",
                                    gap: 0.5,
                                    p: 1,
                                    border: "1px solid",
                                    borderColor: theme.fgc.border.default,
                                    borderRadius: 1.25,
                                    backgroundColor: theme.fgc.surface.base,
                                })}
                            >
                                <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                    <AppChip size="small" label={`${formatTimestamp(annotation.startTimeMs)} - ${formatTimestamp(annotation.endTimeMs)}`} />
                                    <AppChip size="small" variant="outlined" label={annotation.eventKind === "memory" ? "Memory" : "Task"} />
                                    <AppChip size="small" variant="outlined" label={humanizeCategory(annotation.category)} />
                                </AppStack>
                                <AppTypography variant="subtitle2">{annotation.title || humanizeCategory(annotation.category)}</AppTypography>
                                <AppButton type="button" variant="outlined" size="small" onClick={() => setSeekCommand({id: Date.now(), timeMs: annotation.startTimeMs})}>Go To Clip</AppButton>
                            </AppBox>
                        ))}
                    </AppStack>
                </SectionCard>
            </AppBox>
        </PageShell>
    );
}
