import React from "react";

import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ReplayAnnotation, ReplayVideo} from "@/src/types/replayLab";
import {ReplayTimeline} from "../ReplayTimeline";
import {ReplayVideoPlayer} from "../ReplayVideoPlayer";
import {ReplayYouTubePlayer} from "../ReplayYouTubePlayer";

interface ReplayPlaybackPanelProps {
    playerLoading: boolean;
    selectedVideo: ReplayVideo | null;
    playbackUrl: string | null;
    seekCommand: {id: number; timeMs: number} | null;
    annotations: ReplayAnnotation[];
    clipStartMs: number | null;
    clipEndMs: number | null;
    playbackPosition: {timeMs: number; frame: number; durationMs: number};
    canMarkRange: boolean;
    onPlaybackPositionChange: (position: {timeMs: number; frame: number; durationMs: number}) => void;
    onSeek: (timeMs: number) => void;
    onMarkClipStart: () => void;
    onMarkClipEnd: () => void;
}

export function ReplayPlaybackPanel({
    playerLoading,
    selectedVideo,
    playbackUrl,
    seekCommand,
    annotations,
    clipStartMs,
    clipEndMs,
    playbackPosition,
    canMarkRange,
    onPlaybackPositionChange,
    onSeek,
    onMarkClipStart,
    onMarkClipEnd,
}: ReplayPlaybackPanelProps) {
    const markerControls = (
        <>
            <AppButton type="button" variant="outlined" disabled={!canMarkRange} onClick={onMarkClipStart}>Set Start</AppButton>
            <AppButton type="button" variant="outlined" disabled={!canMarkRange} onClick={onMarkClipEnd}>Set End</AppButton>
            <AppButton type="button" variant="outlined" disabled={clipStartMs === null} onClick={() => clipStartMs !== null && onSeek(clipStartMs)}>Go Start</AppButton>
        </>
    );
    const timeline = (
        <ReplayTimeline annotations={annotations} clipStartMs={clipStartMs} clipEndMs={clipEndMs} cursorMs={playbackPosition.timeMs} durationMs={playbackPosition.durationMs || selectedVideo?.durationMs || 0} onSeek={onSeek} />
    );

    return (
        <AppBox sx={(theme) => ({display: "grid", gap: 0.7, px: {xs: 0, md: 0.5}, py: {xs: 0, md: 0.25}, borderRadius: 1.5, backgroundColor: theme.fgc.surface.base})}>
            {playerLoading ? <AppAlert severity="info">Loading player...</AppAlert> : null}
            {selectedVideo?.sourceType === "youtube" ? (
                <ReplayYouTubePlayer videoId={selectedVideo.youtubeVideoId} fps={60} title={selectedVideo.originalFilename} seekCommand={seekCommand} onPlaybackPositionChange={onPlaybackPositionChange} timelineAddon={timeline} controlsAddon={markerControls} />
            ) : (
                <ReplayVideoPlayer src={playbackUrl} title={selectedVideo?.originalFilename ?? "Replay playback"} seekCommand={seekCommand} onPlaybackPositionChange={onPlaybackPositionChange} timelineAddon={timeline} controlsAddon={markerControls} />
            )}
            <AppTypography variant="body2" color="text.secondary" sx={{width: {xs: "100%", md: "82%"}, mx: "auto"}}>Mark: I start, O end, G go start, S save.</AppTypography>
        </AppBox>
    );
}
