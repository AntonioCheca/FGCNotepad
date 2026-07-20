import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {
    PracticeTaskScheduleType,
    ReplayAnnotation,
    ReplayAnnotationCategory,
    ReplayAnnotationEventKind,
    ReplayAnnotationExportResult,
    ReplayReviewAccess,
    ReplayReviewSession,
    ReplayVideo,
} from "@/src/types/replayLab";
import {WorkflowMode} from "../replayReviewUtils";
import {ReplayAnnotationPanel} from "./ReplayAnnotationPanel";
import {ReplayCoachLinkPanel} from "./ReplayCoachLinkPanel";
import {ReplayPlaybackPanel} from "./ReplayPlaybackPanel";
import {ReplaySavedAnnotations} from "./ReplaySavedAnnotations";

interface ReplayReviewWorkspaceProps {
    activeSession: ReplayReviewSession | null;
    selectedVideo: ReplayVideo | null;
    workflowMode: WorkflowMode | null;
    playerLoading: boolean;
    playbackUrl: string | null;
    seekCommand: {id: number; timeMs: number} | null;
    annotations: ReplayAnnotation[];
    clipStartMs: number | null;
    clipEndMs: number | null;
    clipDurationMs: number | null;
    playbackPosition: {timeMs: number; frame: number; durationMs: number};
    canMarkRange: boolean;
    canSaveAnnotation: boolean;
    canExport: boolean;
    loading: boolean;
    exporting: boolean;
    eventKind: ReplayAnnotationEventKind;
    category: ReplayAnnotationCategory;
    annotationTitle: string;
    annotationNotes: string;
    annotationAnswer: string;
    taskScheduleType: PracticeTaskScheduleType;
    taskOccurrences: string;
    taskDueDate: string;
    editingAnnotationId: string | null;
    exportResult: ReplayAnnotationExportResult | null;
    shareLabel: string;
    shareExpiresAt: string;
    sharePassword: string;
    sharedReviewUrl: string | null;
    createdShareLink: ReplayReviewAccess | null;
    shareLinks: ReplayReviewAccess[];
    onResetEditor: () => void;
    onSaveAndExport: () => void;
    onPlaybackPositionChange: (position: {timeMs: number; frame: number; durationMs: number}) => void;
    onSeek: (timeMs: number) => void;
    onMarkClipStart: () => void;
    onMarkClipEnd: () => void;
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
    onEditAnnotation: (annotation: ReplayAnnotation) => void;
    onRemoveAnnotation: (annotationId: string) => void;
    onShareLabelChange: (value: string) => void;
    onShareExpiresAtChange: (value: string) => void;
    onSharePasswordChange: (value: string) => void;
    onGenerateShareLink: () => void;
    onRevokeCoachLink: (shareLinkId: string) => void;
}

export function ReplayReviewWorkspace({
    activeSession,
    selectedVideo,
    workflowMode,
    playerLoading,
    playbackUrl,
    seekCommand,
    annotations,
    clipStartMs,
    clipEndMs,
    clipDurationMs,
    playbackPosition,
    canMarkRange,
    canSaveAnnotation,
    canExport,
    loading,
    exporting,
    eventKind,
    category,
    annotationTitle,
    annotationNotes,
    annotationAnswer,
    taskScheduleType,
    taskOccurrences,
    taskDueDate,
    editingAnnotationId,
    exportResult,
    shareLabel,
    shareExpiresAt,
    sharePassword,
    sharedReviewUrl,
    createdShareLink,
    shareLinks,
    onResetEditor,
    onSaveAndExport,
    onPlaybackPositionChange,
    onSeek,
    onMarkClipStart,
    onMarkClipEnd,
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
    onEditAnnotation,
    onRemoveAnnotation,
    onShareLabelChange,
    onShareExpiresAtChange,
    onSharePasswordChange,
    onGenerateShareLink,
    onRevokeCoachLink,
}: ReplayReviewWorkspaceProps) {
    return (
        <AppBox sx={{display: "grid", gap: 1.5}}>
            <AppStack direction={{xs: "column", md: "row"}} spacing={1} alignItems={{xs: "stretch", md: "center"}} justifyContent="space-between">
                <AppBox>
                    <AppTypography variant="h6">{activeSession?.title}</AppTypography>
                    <AppTypography color="text.secondary">{workflowMode === "coaching" ? "Coaching Review: YouTube playback, local export source." : "Local Review: browser playback, local export source."}</AppTypography>
                </AppBox>
                <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <AppButton type="button" variant="outlined" onClick={onResetEditor}>Change Workflow</AppButton>
                    <AppButton type="button" disabled={!canExport || loading || exporting} onClick={onSaveAndExport}>{exporting ? "Preparing..." : "Export Clips"}</AppButton>
                </AppStack>
            </AppStack>

            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", lg: "minmax(0, 0.9fr) minmax(340px, 420px)", xl: "minmax(0, 0.86fr) 440px"}, gap: 1, alignItems: "start"}}>
                <ReplayPlaybackPanel
                    playerLoading={playerLoading}
                    selectedVideo={selectedVideo}
                    playbackUrl={playbackUrl}
                    seekCommand={seekCommand}
                    annotations={annotations}
                    clipStartMs={clipStartMs}
                    clipEndMs={clipEndMs}
                    playbackPosition={playbackPosition}
                    canMarkRange={canMarkRange}
                    onPlaybackPositionChange={onPlaybackPositionChange}
                    onSeek={onSeek}
                    onMarkClipStart={onMarkClipStart}
                    onMarkClipEnd={onMarkClipEnd}
                />

                <AppStack spacing={1} sx={{maxHeight: {lg: "calc(100vh - 190px)"}, overflow: {lg: "auto"}, pr: {lg: 0.25}}}>
                    <ReplayAnnotationPanel
                        clipStartMs={clipStartMs}
                        clipEndMs={clipEndMs}
                        clipDurationMs={clipDurationMs}
                        eventKind={eventKind}
                        category={category}
                        annotationTitle={annotationTitle}
                        annotationNotes={annotationNotes}
                        annotationAnswer={annotationAnswer}
                        taskScheduleType={taskScheduleType}
                        taskOccurrences={taskOccurrences}
                        taskDueDate={taskDueDate}
                        canSaveAnnotation={canSaveAnnotation}
                        loading={loading}
                        editingAnnotationId={editingAnnotationId}
                        onEventKindChange={onEventKindChange}
                        onCategoryChange={onCategoryChange}
                        onAnnotationTitleChange={onAnnotationTitleChange}
                        onAnnotationNotesChange={onAnnotationNotesChange}
                        onAnnotationAnswerChange={onAnnotationAnswerChange}
                        onTaskScheduleTypeChange={onTaskScheduleTypeChange}
                        onTaskOccurrencesChange={onTaskOccurrencesChange}
                        onTaskDueDateChange={onTaskDueDateChange}
                        onSubmitAnnotation={onSubmitAnnotation}
                        onClearSelection={onClearSelection}
                        onResetAnnotationForm={onResetAnnotationForm}
                    />

                    <ReplaySavedAnnotations annotations={annotations} exportResult={exportResult} onSeek={onSeek} onEditAnnotation={onEditAnnotation} onRemoveAnnotation={onRemoveAnnotation} />
                </AppStack>
            </AppBox>

            {workflowMode === "coaching" ? (
                <ReplayCoachLinkPanel
                    shareLabel={shareLabel}
                    shareExpiresAt={shareExpiresAt}
                    sharePassword={sharePassword}
                    sharedReviewUrl={sharedReviewUrl}
                    createdShareLink={createdShareLink}
                    shareLinks={shareLinks}
                    loading={loading}
                    onShareLabelChange={onShareLabelChange}
                    onShareExpiresAtChange={onShareExpiresAtChange}
                    onSharePasswordChange={onSharePasswordChange}
                    onGenerateShareLink={onGenerateShareLink}
                    onRevokeCoachLink={onRevokeCoachLink}
                />
            ) : null}
        </AppBox>
    );
}
