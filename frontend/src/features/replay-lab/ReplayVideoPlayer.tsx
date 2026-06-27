import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTypography} from "@/src/components/ui/AppTypography";

interface ReplayVideoPlayerProps {
    src: string | null;
    fps?: number | null;
    title: string;
    seekToMs?: number | null;
    onPlaybackPositionChange?: (position: {timeMs: number; frame: number}) => void;
    controlsAddon?: React.ReactNode;
}

function formatPlaybackTime(seconds: number): string {
    if (!Number.isFinite(seconds)) {
        return "00:00.000";
    }

    const minutes = Math.floor(seconds / 60);
    const wholeSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

export function ReplayVideoPlayer({src, fps, title, seekToMs, onPlaybackPositionChange, controlsAddon}: ReplayVideoPlayerProps) {
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isReady, setIsReady] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(0);
    const effectiveFps = typeof fps === "number" && fps > 0 ? fps : 60;
    const frame = Math.max(0, Math.round(currentTime * effectiveFps));
    const canUseControls = Boolean(src && isReady);

    React.useEffect(() => {
        setIsPlaying(false);
        setIsReady(false);
        setCurrentTime(0);
    }, [src]);

    React.useEffect(() => {
        const video = videoRef.current;
        if (!video || !isReady || typeof seekToMs !== "number") {
            return;
        }

        video.currentTime = Math.max(0, seekToMs / 1000);
        setCurrentTime(video.currentTime);
    }, [isReady, seekToMs]);

    React.useEffect(() => {
        onPlaybackPositionChange?.({timeMs: Math.round(currentTime * 1000), frame});
    }, [currentTime, frame, onPlaybackPositionChange]);

    React.useEffect(() => {
        const video = videoRef.current;
        if (!video || !isReady || !("requestVideoFrameCallback" in HTMLVideoElement.prototype)) {
            return undefined;
        }

        let callbackId = 0;
        const syncFrameTime = () => {
            setCurrentTime(video.currentTime);
            callbackId = video.requestVideoFrameCallback(syncFrameTime);
        };
        callbackId = video.requestVideoFrameCallback(syncFrameTime);

        return () => video.cancelVideoFrameCallback(callbackId);
    }, [isReady, src]);

    const seekBy = React.useCallback((seconds: number) => {
        const video = videoRef.current;
        if (!video || !isReady) {
            return;
        }

        video.currentTime = Math.max(0, Math.min(video.duration || Number.MAX_SAFE_INTEGER, video.currentTime + seconds));
        setCurrentTime(video.currentTime);
    }, [isReady]);

    const togglePlayback = React.useCallback(async () => {
        const video = videoRef.current;
        if (!video || !isReady) {
            return;
        }

        if (video.paused) {
            try {
                await video.play();
                setIsPlaying(true);
            } catch {
                setIsPlaying(false);
            }
            return;
        }

        video.pause();
        setIsPlaying(false);
    }, [isReady]);

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!canUseControls || shouldIgnoreShortcut(event)) {
                return;
            }

            if (event.code === "Space") {
                event.preventDefault();
                void togglePlayback();
                return;
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                seekBy(-1);
                return;
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                seekBy(1);
                return;
            }

            if (event.key === "," || event.key === "[") {
                event.preventDefault();
                seekBy(-1 / effectiveFps);
                return;
            }

            if (event.key === "." || event.key === "]") {
                event.preventDefault();
                seekBy(1 / effectiveFps);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [canUseControls, effectiveFps, seekBy, togglePlayback]);

    return (
        <AppBox sx={{display: "grid", gap: 1.15}}>
            <AppBox
                sx={(theme) => ({
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: theme.fgc.border.strong,
                    borderRadius: 1.5,
                    backgroundColor: theme.fgc.surface.sunken,
                    minHeight: {xs: 220, md: 420},
                    display: "grid",
                    placeItems: "center",
                })}
            >
                {src ? (
                    <video
                        ref={videoRef}
                        src={src}
                        controls={isReady}
                        preload="metadata"
                        playsInline
                        aria-label={title}
                        onLoadedMetadata={(event) => {
                            setIsReady(true);
                            setCurrentTime(event.currentTarget.currentTime);
                        }}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                        onWaiting={() => setIsReady(false)}
                        onCanPlay={() => setIsReady(true)}
                        style={{width: "100%", maxHeight: "min(72vh, 760px)", display: "block"}}
                    />
                ) : (
                    <AppTypography color="text.secondary">Select a replay to load private playback.</AppTypography>
                )}
            </AppBox>

            <AppStack direction={{xs: "column", md: "row"}} spacing={0.75} alignItems={{xs: "stretch", md: "center"}} justifyContent="space-between">
                <AppStack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    <AppButton type="button" variant="contained" onClick={togglePlayback} disabled={!canUseControls}>
                        {isPlaying ? "Pause" : "Play"}
                    </AppButton>
                    <AppButton type="button" variant="outlined" onClick={() => seekBy(-1)} disabled={!canUseControls}>-1s</AppButton>
                    <AppButton type="button" variant="outlined" onClick={() => seekBy(-1 / effectiveFps)} disabled={!canUseControls}>-1f</AppButton>
                    <AppButton type="button" variant="outlined" onClick={() => seekBy(1 / effectiveFps)} disabled={!canUseControls}>+1f</AppButton>
                    <AppButton type="button" variant="outlined" onClick={() => seekBy(1)} disabled={!canUseControls}>+1s</AppButton>
                    {controlsAddon}
                </AppStack>

                <AppTypography variant="body2" color="text.secondary">{isReady ? formatPlaybackTime(currentTime) : "Loading video..."}</AppTypography>
            </AppStack>
            <AppTypography variant="caption" color="text.secondary">Shortcuts: Space play/pause, Left/Right +/-1s, [ ] or , . for fine frame-step seeks.</AppTypography>
        </AppBox>
    );
}
