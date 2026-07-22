import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {
    ReplayAnnotation,
    ReplayAnnotationCategory,
    ReplayAnnotationEventKind,
    ReplayAnnotationExportResult,
    ReplayReviewAccess,
    ReplayVideo,
} from "@/src/types/replayLab";
import {WorkflowMode} from "../replayReviewUtils";
import {ReplayAnnotationPanel} from "./ReplayAnnotationPanel";
import {ReplayCoachLinkPanel} from "./ReplayCoachLinkPanel";
import {ReplayPlaybackPanel} from "./ReplayPlaybackPanel";
import {ReplaySavedAnnotations} from "./ReplaySavedAnnotations";

interface ReplayReviewWorkspaceProps {
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
    editingAnnotationId: string | null;
    exportResult: ReplayAnnotationExportResult | null;
    exportLogs: string[];
    exportProgress: number;
    exportStatusLabel?: string | null;
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
    editingAnnotationId,
    exportResult,
    exportLogs,
    exportProgress,
    exportStatusLabel = null,
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
    const showExportProgress = exportStatusLabel !== null || exportLogs.length > 0;

    return (
        <AppBox sx={{display: "grid", gap: 1.5}}>
            <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                <AppButton type="button" variant="outlined" onClick={onResetEditor}>Change Workflow</AppButton>
                <AppButton type="button" disabled={!canExport || loading || exporting} onClick={onSaveAndExport}>{exporting ? exportStatusLabel ?? "Preparing..." : "Generate Clips"}</AppButton>
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
                        canSaveAnnotation={canSaveAnnotation}
                        loading={loading}
                        editingAnnotationId={editingAnnotationId}
                        onEventKindChange={onEventKindChange}
                        onCategoryChange={onCategoryChange}
                        onAnnotationTitleChange={onAnnotationTitleChange}
                        onSubmitAnnotation={onSubmitAnnotation}
                        onClearSelection={onClearSelection}
                        onResetAnnotationForm={onResetAnnotationForm}
                    />

                    <ReplaySavedAnnotations annotations={annotations} exportResult={exportResult} onSeek={onSeek} onEditAnnotation={onEditAnnotation} onRemoveAnnotation={onRemoveAnnotation} />

                    {showExportProgress ? (
                        <SectionCard title="Export Progress" tone="sunken" variant="finalize">
                            <AppStack spacing={0.9}>
                                <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                    <AppChip size="small" label={exportStatusLabel === "idle" ? "Ready" : exportStatusLabel ?? "Preparing"} />
                                    {exportStatusLabel && !["idle", "done", "failed"].includes(exportStatusLabel) ? <AppChip size="small" variant="outlined" label={`${Math.round(exportProgress * 100)}%`} /> : null}
                                </AppStack>
                                <AppBox sx={(theme) => ({maxHeight: 220, overflow: "auto", p: 1, border: "1px solid", borderColor: theme.fgc.border.default, borderRadius: 1.25, backgroundColor: theme.fgc.surface.sunken})}>
                                    {exportLogs.length === 0 ? <AppTypography variant="body2" color="text.secondary">Export progress will appear here.</AppTypography> : null}
                                    {exportLogs.map((log, index) => <AppTypography key={`${index}-${log}`} variant="caption" component="pre" sx={{whiteSpace: "pre-wrap", m: 0}}>{log}</AppTypography>)}
                                </AppBox>
                            </AppStack>
                        </SectionCard>
                    ) : null}
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
