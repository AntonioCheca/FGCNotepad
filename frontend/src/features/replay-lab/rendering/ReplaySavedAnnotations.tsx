import React from "react";

import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {ReplayAnnotation, ReplayAnnotationExportResult} from "@/src/types/replayLab";
import {formatTimestamp, humanizeCategory} from "../replayReviewUtils";

interface ReplaySavedAnnotationsProps {
    annotations: ReplayAnnotation[];
    exportResult: ReplayAnnotationExportResult | null;
    onSeek: (timeMs: number) => void;
    onEditAnnotation: (annotation: ReplayAnnotation) => void;
    onRemoveAnnotation: (annotationId: string) => void;
}

export function ReplaySavedAnnotations({annotations, exportResult, onSeek, onEditAnnotation, onRemoveAnnotation}: ReplaySavedAnnotationsProps) {
    return (
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
                            <AppButton type="button" variant="outlined" size="small" onClick={() => onSeek(annotation.startTimeMs)}>Go</AppButton>
                            <AppButton type="button" variant="outlined" size="small" disabled={Boolean(annotation.exportedClip)} onClick={() => onEditAnnotation(annotation)}>Edit</AppButton>
                            <AppButton type="button" variant="outlined" color="error" size="small" disabled={Boolean(annotation.exportedClip)} onClick={() => onRemoveAnnotation(annotation.id)}>Delete</AppButton>
                        </AppStack>
                    </AppBox>
                ))}
            </AppStack>
        </SectionCard>
    );
}
