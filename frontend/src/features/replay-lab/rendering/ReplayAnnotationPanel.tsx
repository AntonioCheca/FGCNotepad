import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {ReplayAnnotationCategory, ReplayAnnotationEventKind} from "@/src/types/replayLab";
import {categoriesFor, formatTimestamp, humanizeCategory} from "../replayReviewUtils";

interface ReplayAnnotationPanelProps {
    clipStartMs: number | null;
    clipEndMs: number | null;
    clipDurationMs: number | null;
    eventKind: ReplayAnnotationEventKind;
    category: ReplayAnnotationCategory;
    annotationTitle: string;
    canSaveAnnotation: boolean;
    loading: boolean;
    editingAnnotationId: string | null;
    onEventKindChange: (eventKind: ReplayAnnotationEventKind) => void;
    onCategoryChange: (category: ReplayAnnotationCategory) => void;
    onAnnotationTitleChange: (value: string) => void;
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
    canSaveAnnotation,
    loading,
    editingAnnotationId,
    onEventKindChange,
    onCategoryChange,
    onAnnotationTitleChange,
    onSubmitAnnotation,
    onClearSelection,
    onResetAnnotationForm,
}: ReplayAnnotationPanelProps) {
    return (
        <SectionCard title="Annotation" tone="raised" variant="input">
            <AppStack spacing={0.75}>
                <AppTypography variant="body2" color={clipDurationMs !== null && clipDurationMs > 10000 ? "error" : "text.secondary"}>
                    {clipStartMs === null ? "Start unset" : `Start ${formatTimestamp(clipStartMs)}`} - {clipEndMs === null ? "End unset" : `End ${formatTimestamp(clipEndMs)}`} - {clipDurationMs === null ? "No duration" : formatTimestamp(Math.max(0, clipDurationMs))}
                </AppTypography>
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "0.72fr 1fr"}, gap: 0.75}}>
                    <AppTextField select label="Clip kind" value={eventKind} onChange={(event) => onEventKindChange(event.target.value as ReplayAnnotationEventKind)}>
                        <AppMenuItem value="memory">Memory Flashcard</AppMenuItem>
                        <AppMenuItem value="task">Task</AppMenuItem>
                    </AppTextField>
                    <AppTextField select label={eventKind === "memory" ? "Flashcard answer" : "Task type"} value={category} onChange={(event) => onCategoryChange(event.target.value as ReplayAnnotationCategory)}>
                        {categoriesFor(eventKind).map((item) => <AppMenuItem key={item} value={item}>{humanizeCategory(item)}</AppMenuItem>)}
                    </AppTextField>
                </AppBox>
                {eventKind === "task" ? (
                    <AppTextField label="Task title" value={annotationTitle} onChange={(event) => onAnnotationTitleChange(event.target.value)} />
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
