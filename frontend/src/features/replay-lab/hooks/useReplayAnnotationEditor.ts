import React from "react";

import {
    PracticeTaskScheduleType,
    ReplayAnnotation,
    ReplayAnnotationCategory,
    ReplayAnnotationEventKind,
    ReplayAnnotationExportResult,
    ReplayReviewSession,
} from "@/src/types/replayLab";
import {defaultCategory, getReplayLabErrorMessage, shouldIgnoreReplayShortcut} from "../replayReviewUtils";

interface ReplayAnnotationPayload {
    startTimeMs: number;
    endTimeMs: number;
    eventKind: ReplayAnnotationEventKind;
    category: ReplayAnnotationCategory;
    title: string;
    notes: string | null;
    answer: string | null;
}

interface UseReplayAnnotationEditorOptions {
    activeSession: ReplayReviewSession | null;
    playbackPosition: {timeMs: number; frame: number; durationMs: number};
    canMarkRange: boolean;
    loading: boolean;
    isEditorOpen: boolean;
    listAnnotations: (sessionId: string) => Promise<ReplayAnnotation[]>;
    createAnnotation: (sessionId: string, payload: ReplayAnnotationPayload) => Promise<unknown>;
    updateAnnotation: (annotationId: string, payload: ReplayAnnotationPayload) => Promise<unknown>;
    deleteAnnotation: (annotationId: string) => Promise<unknown>;
    onError: (message: string) => void;
    onNotice: (message: string) => void;
    onClearError: () => void;
    onClearNotice: () => void;
    onExportResultChange: (result: ReplayAnnotationExportResult | null) => void;
    onSeek: (timeMs: number) => void;
}

export function useReplayAnnotationEditor({
    activeSession,
    playbackPosition,
    canMarkRange,
    loading,
    isEditorOpen,
    listAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    onError,
    onNotice,
    onClearError,
    onClearNotice,
    onExportResultChange,
    onSeek,
}: UseReplayAnnotationEditorOptions) {
    const [annotations, setAnnotations] = React.useState<ReplayAnnotation[]>([]);
    const [clipStartMs, setClipStartMs] = React.useState<number | null>(null);
    const [clipEndMs, setClipEndMs] = React.useState<number | null>(null);
    const [eventKind, setEventKind] = React.useState<ReplayAnnotationEventKind>("memory");
    const [category, setCategory] = React.useState<ReplayAnnotationCategory>(() => defaultCategory("memory"));
    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNotes, setAnnotationNotes] = React.useState("");
    const [annotationAnswer, setAnnotationAnswer] = React.useState("");
    const [taskScheduleType, setTaskScheduleType] = React.useState<PracticeTaskScheduleType>("once");
    const [taskOccurrences, setTaskOccurrences] = React.useState("1");
    const [taskDueDate, setTaskDueDate] = React.useState("");
    const [editingAnnotationId, setEditingAnnotationId] = React.useState<string | null>(null);

    const clearSelection = React.useCallback(() => {
        setClipStartMs(null);
        setClipEndMs(null);
    }, []);

    const resetAnnotationForm = React.useCallback(() => {
        clearSelection();
        setAnnotationTitle("");
        setAnnotationNotes("");
        setAnnotationAnswer("");
        setTaskScheduleType("once");
        setTaskOccurrences("1");
        setTaskDueDate("");
        setEditingAnnotationId(null);
    }, [clearSelection]);

    const refreshAnnotations = React.useCallback(async (sessionId: string) => {
        setAnnotations(await listAnnotations(sessionId));
    }, [listAnnotations]);

    const buildAnnotationNotes = React.useCallback((): string | null => {
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
    }, [annotationNotes, eventKind, taskDueDate, taskOccurrences, taskScheduleType]);

    const markClipStart = React.useCallback(() => {
        setClipStartMs(playbackPosition.timeMs);
        setClipEndMs((currentEnd) => currentEnd !== null && currentEnd <= playbackPosition.timeMs ? null : currentEnd);
    }, [playbackPosition.timeMs]);

    const markClipEnd = React.useCallback(() => setClipEndMs(playbackPosition.timeMs), [playbackPosition.timeMs]);

    const handleEventKindChange = React.useCallback((nextEventKind: ReplayAnnotationEventKind) => {
        setEventKind(nextEventKind);
        setCategory(defaultCategory(nextEventKind));
    }, []);

    const editAnnotation = React.useCallback((annotation: ReplayAnnotation) => {
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
        onSeek(annotation.startTimeMs);
    }, [onSeek]);

    const clipDurationMs = clipStartMs !== null && clipEndMs !== null ? clipEndMs - clipStartMs : null;
    const canSaveAnnotation = Boolean(activeSession && clipDurationMs !== null && clipDurationMs > 0 && clipDurationMs <= 10000);

    const submitAnnotation = React.useCallback(async () => {
        if (!activeSession) {
            onError("Start a review before saving annotations.");
            return;
        }
        if (clipStartMs === null || clipEndMs === null || clipEndMs <= clipStartMs) {
            onError("Mark a valid start and end before saving.");
            return;
        }

        onClearError();
        onClearNotice();
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
            onExportResultChange(null);
            onNotice(editingAnnotationId ? "Annotation updated." : "Annotation saved.");
        } catch (caughtError: unknown) {
            onError(getReplayLabErrorMessage(caughtError));
        }
    }, [activeSession, annotationAnswer, annotationTitle, buildAnnotationNotes, category, clipEndMs, clipStartMs, createAnnotation, editingAnnotationId, eventKind, onClearError, onClearNotice, onError, onExportResultChange, onNotice, refreshAnnotations, resetAnnotationForm, updateAnnotation]);

    const removeAnnotation = React.useCallback(async (annotationId: string) => {
        if (!activeSession) {
            return;
        }

        onClearError();
        onClearNotice();
        try {
            await deleteAnnotation(annotationId);
            await refreshAnnotations(activeSession.id);
            onExportResultChange(null);
            onNotice("Annotation deleted.");
        } catch (caughtError: unknown) {
            onError(getReplayLabErrorMessage(caughtError));
        }
    }, [activeSession, deleteAnnotation, onClearError, onClearNotice, onError, onExportResultChange, onNotice, refreshAnnotations]);

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

            if (!shortcutState.isEditorOpen || shouldIgnoreReplayShortcut(event)) {
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
                    onSeek(shortcutState.clipStartMs);
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
    }, [onSeek]);

    return {
        annotations,
        setAnnotations,
        clipStartMs,
        clipEndMs,
        eventKind,
        category,
        annotationTitle,
        annotationNotes,
        annotationAnswer,
        taskScheduleType,
        taskOccurrences,
        taskDueDate,
        editingAnnotationId,
        clipDurationMs,
        canSaveAnnotation,
        canMarkRange,
        setCategory,
        setAnnotationTitle,
        setAnnotationNotes,
        setAnnotationAnswer,
        setTaskScheduleType,
        setTaskOccurrences,
        setTaskDueDate,
        clearSelection,
        resetAnnotationForm,
        refreshAnnotations,
        markClipStart,
        markClipEnd,
        handleEventKindChange,
        editAnnotation,
        submitAnnotation,
        removeAnnotation,
    };
}
