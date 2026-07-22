import React from "react";
import {useReplayLab} from "@/hooks/useReplayLab";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppStack} from "@/src/components/ui/AppStack";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {useReplayAnnotationEditor} from "@/src/features/replay-lab/hooks/useReplayAnnotationEditor";
import {useReplayCoachSharing} from "@/src/features/replay-lab/hooks/useReplayCoachSharing";
import {useLocalReplayClipExport} from "@/src/features/replay-lab/hooks/useLocalReplayClipExport";
import {useReplayReviewWorkflow} from "@/src/features/replay-lab/hooks/useReplayReviewWorkflow";
import {ReplayReviewLauncher} from "@/src/features/replay-lab/rendering/ReplayReviewLauncher";
import {ReplayReviewWorkspace} from "@/src/features/replay-lab/rendering/ReplayReviewWorkspace";
import {getReplayLabErrorMessage} from "@/src/features/replay-lab/replayReviewUtils";
import type {ReplayAnnotationExportResult, ReplayLabLimits, ReplayReviewSession} from "@/src/types/replayLab";

interface ReplayLabReviewPageProps {
    routeMode: "local" | "upload";
}

export function ReplayLabReviewPage({routeMode}: ReplayLabReviewPageProps) {
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
        uploadAnnotationClip,
        createShareLink,
        listShareLinks,
        revokeShareLink,
    } = useReplayLab();

    const [sessions, setSessions] = React.useState<ReplayReviewSession[]>([]);
    const [exportResult, setExportResult] = React.useState<ReplayAnnotationExportResult | null>(null);
    const [exporting, setExporting] = React.useState(false);
    const [limits, setLimits] = React.useState<ReplayLabLimits | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [notice, setNotice] = React.useState<string | null>(null);

    const clearError = React.useCallback(() => setError(null), []);
    const clearNotice = React.useCallback(() => setNotice(null), []);

    const refreshSessions = React.useCallback(async () => {
        setSessions(await listReviewSessions());
    }, [listReviewSessions]);

    const workflow = useReplayReviewWorkflow({
        createLocalFileVideo,
        createYouTubeVideo,
        createReviewSession,
        deleteReviewSession,
        fetchVideoPlaybackBlob,
        refreshSessions,
        onError: setError,
        onNotice: setNotice,
        onClearError: clearError,
        onClearNotice: clearNotice,
    });

    const annotationEditor = useReplayAnnotationEditor({
        activeSession: workflow.activeSession,
        playbackPosition: workflow.playbackPosition,
        canMarkRange: workflow.canMarkRange,
        loading,
        isEditorOpen: workflow.isEditorOpen,
        listAnnotations,
        createAnnotation,
        updateAnnotation,
        deleteAnnotation,
        onError: setError,
        onNotice: setNotice,
        onClearError: clearError,
        onClearNotice: clearNotice,
        onExportResultChange: setExportResult,
        onSeek: workflow.seekToTime,
    });

    const coachSharing = useReplayCoachSharing({
        activeSession: workflow.activeSession,
        workflowMode: workflow.workflowMode,
        createShareLink,
        listShareLinks,
        revokeShareLink,
        onError: setError,
        onNotice: setNotice,
        onClearError: clearError,
        onClearNotice: clearNotice,
    });

    const localClipExport = useLocalReplayClipExport({
        saveReviewSession,
        uploadAnnotationClip,
        exportReviewSession,
        listAnnotations,
    });

    const {refreshAnnotations, resetAnnotationForm, setAnnotations} = annotationEditor;
    const {refreshShareLinks, resetShareState} = coachSharing;

    React.useEffect(() => {
        void refreshSessions().catch((caughtError: unknown) => setError(getReplayLabErrorMessage(caughtError)));
        void getReplayLabLimits().then(setLimits).catch(() => undefined);
    }, [getReplayLabLimits, refreshSessions]);

    React.useEffect(() => {
        setAnnotations([]);
        resetAnnotationForm();
        resetShareState();
        setExportResult(null);

        if (!workflow.activeSession) {
            return;
        }

        void refreshAnnotations(workflow.activeSession.id).catch((caughtError: unknown) => setError(getReplayLabErrorMessage(caughtError)));
        if (workflow.workflowMode === "coaching") {
            void refreshShareLinks(workflow.activeSession.id).catch(() => undefined);
        }
    }, [refreshAnnotations, refreshShareLinks, resetAnnotationForm, resetShareState, setAnnotations, workflow.activeSession, workflow.workflowMode]);

    const saveAndExport = async () => {
        if (!workflow.activeSession) {
            setError("Start a review before exporting.");
            return;
        }

        setError(null);
        setNotice(null);
        localClipExport.setError(null);
        setExporting(routeMode === "upload");
        try {
            if (routeMode === "local") {
                if (!localClipExport.isIsolated) {
                    setError("Local clip generation needs the isolated local route. Reload this page and try again.");
                    return;
                }
                const result = await localClipExport.runExport({
                    session: workflow.activeSession,
                    file: workflow.localSourceFile,
                    annotations: annotationEditor.annotations,
                    onAnnotationsChange: annotationEditor.setAnnotations,
                });
                if (result) {
                    setExportResult(result);
                    setNotice(result.failed > 0 ? "Export finished with failures." : "Review exported to practice and study queues.");
                }
                return;
            }

            await saveReviewSession(workflow.activeSession.id);
            if (workflow.selectedVideo?.sourceType === "youtube") {
                window.location.assign(`/replay-lab/export?sessionId=${encodeURIComponent(workflow.activeSession.id)}`);
                return;
            }

            const result = await exportReviewSession(workflow.activeSession.id);
            setExportResult(result);
            await annotationEditor.refreshAnnotations(workflow.activeSession.id);
            setNotice(result.failed > 0 ? "Export finished with failures." : "Review exported to practice and study queues.");
        } catch (caughtError: unknown) {
            setError(getReplayLabErrorMessage(caughtError));
        } finally {
            setExporting(false);
        }
    };

    const resetEditor = () => {
        workflow.resetEditor();
        annotationEditor.setAnnotations([]);
        annotationEditor.resetAnnotationForm();
        coachSharing.resetShareState();
        setExportResult(null);
    };

    const isExporting = exporting || localClipExport.busy;
    const canExport = Boolean(workflow.activeSession && annotationEditor.annotations.length > 0 && (routeMode !== "local" || workflow.localSourceFile));
    const badgeLabel = routeMode === "local" ? "Local Review" : "Online Review";

    return (
        <PageShell
            title={routeMode === "local" ? "Local Replay Lab" : "Online Replay Lab"}
            badgeLabel={workflow.workflowMode ? badgeLabel : "Review Replays"}
        >
            <AppStack spacing={1.5}>
                {error ? <AppAlert severity="error" onClose={() => setError(null)}>{error}</AppAlert> : null}
                {localClipExport.error ? <AppAlert severity="error" onClose={() => localClipExport.setError(null)}>{localClipExport.error}</AppAlert> : null}
                {notice ? <AppAlert severity="success" onClose={() => setNotice(null)}>{notice}</AppAlert> : null}
                {routeMode === "local" && !localClipExport.isIsolated ? <AppAlert severity="warning">Local clip generation is unavailable until this page is loaded with isolation headers.</AppAlert> : null}
                {!workflow.isEditorOpen ? (
                    <ReplayReviewLauncher
                        limits={limits}
                        sessions={sessions}
                        localSourceFile={workflow.localSourceFile}
                        youtubeUrl={workflow.youtubeUrl}
                        youtubeTitle={workflow.youtubeTitle}
                        loading={loading}
                        startingWorkflow={workflow.startingWorkflow}
                        routeMode={routeMode}
                        onLocalSourceFileChange={workflow.setLocalSourceFile}
                        onYoutubeUrlChange={workflow.setYoutubeUrl}
                        onYoutubeTitleChange={workflow.setYoutubeTitle}
                        onStartLocalReview={(event) => void workflow.startLocalReview(event)}
                        onStartYouTubeReview={(event) => void workflow.startYouTubeReview(event)}
                        onOpenReviewSession={(session) => void workflow.openReviewSession(session)}
                        onRemoveSession={(sessionId) => void workflow.removeSession(sessionId)}
                    />
                ) : (
                    <ReplayReviewWorkspace
                        selectedVideo={workflow.selectedVideo}
                        workflowMode={workflow.workflowMode}
                        playerLoading={workflow.playerLoading}
                        playbackUrl={workflow.playbackUrl}
                        seekCommand={workflow.seekCommand}
                        annotations={annotationEditor.annotations}
                        clipStartMs={annotationEditor.clipStartMs}
                        clipEndMs={annotationEditor.clipEndMs}
                        clipDurationMs={annotationEditor.clipDurationMs}
                        playbackPosition={workflow.playbackPosition}
                        canMarkRange={workflow.canMarkRange}
                        canSaveAnnotation={annotationEditor.canSaveAnnotation}
                        canExport={canExport}
                        loading={loading}
                        exporting={isExporting}
                        eventKind={annotationEditor.eventKind}
                        category={annotationEditor.category}
                        annotationTitle={annotationEditor.annotationTitle}
                        editingAnnotationId={annotationEditor.editingAnnotationId}
                        exportResult={exportResult}
                        exportLogs={routeMode === "local" ? localClipExport.logs : []}
                        exportProgress={routeMode === "local" ? localClipExport.progress : 0}
                        exportStatusLabel={routeMode === "local" ? localClipExport.status : null}
                        shareLabel={coachSharing.shareLabel}
                        shareExpiresAt={coachSharing.shareExpiresAt}
                        sharePassword={coachSharing.sharePassword}
                        sharedReviewUrl={coachSharing.sharedReviewUrl}
                        createdShareLink={coachSharing.createdShareLink}
                        shareLinks={coachSharing.shareLinks}
                        onResetEditor={resetEditor}
                        onSaveAndExport={() => void saveAndExport()}
                        onPlaybackPositionChange={workflow.setPlaybackPosition}
                        onSeek={workflow.seekToTime}
                        onMarkClipStart={annotationEditor.markClipStart}
                        onMarkClipEnd={annotationEditor.markClipEnd}
                        onEventKindChange={annotationEditor.handleEventKindChange}
                        onCategoryChange={annotationEditor.setCategory}
                        onAnnotationTitleChange={annotationEditor.setAnnotationTitle}
                        onSubmitAnnotation={() => void annotationEditor.submitAnnotation()}
                        onClearSelection={annotationEditor.clearSelection}
                        onResetAnnotationForm={annotationEditor.resetAnnotationForm}
                        onEditAnnotation={annotationEditor.editAnnotation}
                        onRemoveAnnotation={(annotationId) => void annotationEditor.removeAnnotation(annotationId)}
                        onShareLabelChange={coachSharing.setShareLabel}
                        onShareExpiresAtChange={coachSharing.setShareExpiresAt}
                        onSharePasswordChange={coachSharing.setSharePassword}
                        onGenerateShareLink={() => void coachSharing.generateShareLink()}
                        onRevokeCoachLink={(shareLinkId) => void coachSharing.revokeCoachLink(shareLinkId)}
                    />
                )}
            </AppStack>
        </PageShell>
    );
}
