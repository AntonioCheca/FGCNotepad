import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {PracticeTaskScheduleType, ReplayAnnotationCategory, ReplayAnnotationEventKind} from "@/src/types/replayLab";
import {categoriesFor, formatTimestamp, humanizeCategory} from "../replayReviewUtils";

interface ReplayAnnotationPanelProps {
    clipStartMs: number | null;
    clipEndMs: number | null;
    clipDurationMs: number | null;
    eventKind: ReplayAnnotationEventKind;
    category: ReplayAnnotationCategory;
    annotationTitle: string;
    annotationNotes: string;
    annotationAnswer: string;
    taskScheduleType: PracticeTaskScheduleType;
    taskOccurrences: string;
    taskDueDate: string;
    canSaveAnnotation: boolean;
    loading: boolean;
    editingAnnotationId: string | null;
    onEventKindChange: (eventKind: ReplayAnnotationEventKind) => void;
    onCategoryChange: (category: ReplayAnnotationCategory) => void;
    onAnnotationTitleChange: (value: string) => void;
    onAnnotationNotesChange: (value: string) => void;
    onAnnotationAnswerChange: (value: string) => void;
    onTaskScheduleTypeChange: (value: PracticeTaskScheduleType) => void;
    onTaskOccurrencesChange: (value: string) => void;
    onTaskDueDateChange: (value: string) => void;
    onSubmitAnnotation: () => void;
    onClearSelection: () => void;
    onResetAnnotationForm: () => void;
}

export function ReplayAnnotationPanel({
    clipStartMs,
    clipEndMs,
    clipDurationMs,
    eventKind,
    category,
    annotationTitle,
    annotationNotes,
    annotationAnswer,
    taskScheduleType,
    taskOccurrences,
    taskDueDate,
    canSaveAnnotation,
    loading,
    editingAnnotationId,
    onEventKindChange,
    onCategoryChange,
    onAnnotationTitleChange,
    onAnnotationNotesChange,
    onAnnotationAnswerChange,
    onTaskScheduleTypeChange,
    onTaskOccurrencesChange,
    onTaskDueDateChange,
    onSubmitAnnotation,
    onClearSelection,
    onResetAnnotationForm,
}: ReplayAnnotationPanelProps) {
    return (
        <SectionCard title="Annotation" description="Mark, describe, save." tone="raised" variant="input">
            <AppStack spacing={0.75}>
                <AppTypography variant="body2" color={clipDurationMs !== null && clipDurationMs > 10000 ? "error" : "text.secondary"}>
                    {clipStartMs === null ? "Start unset" : `Start ${formatTimestamp(clipStartMs)}`} - {clipEndMs === null ? "End unset" : `End ${formatTimestamp(clipEndMs)}`} - {clipDurationMs === null ? "No duration" : formatTimestamp(Math.max(0, clipDurationMs))}
                </AppTypography>
                <AppBox sx={{display: "grid", gridTemplateColumns: "0.72fr 1fr", gap: 0.75}}>
                    <AppTextField select label="Type" value={eventKind} onChange={(event) => onEventKindChange(event.target.value as ReplayAnnotationEventKind)}>
                        <AppMenuItem value="memory">Memory</AppMenuItem>
                        <AppMenuItem value="task">Task</AppMenuItem>
                    </AppTextField>
                    <AppTextField select label="Category" value={category} onChange={(event) => onCategoryChange(event.target.value as ReplayAnnotationCategory)}>
                        {categoriesFor(eventKind).map((item) => <AppMenuItem key={item} value={item}>{humanizeCategory(item)}</AppMenuItem>)}
                    </AppTextField>
                </AppBox>
                <AppTextField label={eventKind === "memory" ? "Prompt" : "Task"} value={annotationTitle} onChange={(event) => onAnnotationTitleChange(event.target.value)} />
                <AppTextField label="Notes" value={annotationNotes} onChange={(event) => onAnnotationNotesChange(event.target.value)} multiline minRows={1} />
                {eventKind === "memory" ? <AppTextField label="Answer" value={annotationAnswer} onChange={(event) => onAnnotationAnswerChange(event.target.value)} /> : null}
                {eventKind === "task" ? (
                    <AppBox sx={{display: "grid", gridTemplateColumns: "1fr 86px", gap: 0.75}}>
                        <AppTextField select label="Schedule" value={taskScheduleType} onChange={(event) => onTaskScheduleTypeChange(event.target.value as PracticeTaskScheduleType)}>
                            <AppMenuItem value="once">Once</AppMenuItem>
                            <AppMenuItem value="daily_for_n_days">Daily</AppMenuItem>
                            <AppMenuItem value="weekly">Weekly</AppMenuItem>
                            <AppMenuItem value="custom">Custom</AppMenuItem>
                        </AppTextField>
                        <AppTextField label="Reps" value={taskOccurrences} onChange={(event) => onTaskOccurrencesChange(event.target.value)} inputProps={{inputMode: "numeric"}} />
                        <AppTextField label="First due" type="datetime-local" value={taskDueDate} onChange={(event) => onTaskDueDateChange(event.target.value)} InputLabelProps={{shrink: true}} sx={{gridColumn: "1 / -1"}} />
                    </AppBox>
                ) : null}
                <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <AppButton type="button" disabled={!canSaveAnnotation || loading} onClick={onSubmitAnnotation}>{editingAnnotationId ? "Update" : "Save"}</AppButton>
                    <AppButton type="button" variant="outlined" color="secondary" onClick={onClearSelection}>Clear</AppButton>
                    {editingAnnotationId ? <AppButton type="button" variant="outlined" color="secondary" onClick={onResetAnnotationForm}>Cancel</AppButton> : null}
                </AppStack>
            </AppStack>
        </SectionCard>
    );
}
