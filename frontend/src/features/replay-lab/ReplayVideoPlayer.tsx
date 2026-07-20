import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTypography} from "@/src/components/ui/AppTypography";

interface ReplayVideoPlayerProps {
    src: string | null;
    fps?: number | null;
    title: string;
    seekCommand?: {id: number; timeMs: number} | null;
    onPlaybackPositionChange?: (position: {timeMs: number; frame: number; durationMs: number}) => void;
    timelineAddon?: React.ReactNode;
    controlsAddon?: React.ReactNode;
}

interface PlaybackPosition {
    timeMs: number;
    frame: number;
    durationMs: number;
}

type MediaLoadState = "idle" | "loading" | "metadata" | "first-frame" | "ready" | "buffering" | "seeking" | "stalled" | "error";

interface MediaDiagnostics {
    state: MediaLoadState;
    lastEvent: string;
    readyState: number;
    networkState: number;
    duration: number | null;
    bufferedPercent: number;
    errorMessage: string | null;
}

function initialMediaDiagnostics(src: string | null): MediaDiagnostics {
    return {
        state: src ? "loading" : "idle",
        lastEvent: src ? "src" : "idle",
        readyState: 0,
        networkState: 0,
        duration: null,
        bufferedPercent: 0,
        errorMessage: null,
    };
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

function mediaErrorMessage(error: MediaError | null): string | null {
    if (!error) {
        return null;
    }

    const messages: Record<number, string> = {
        1: "Playback was aborted.",
        2: "A network error interrupted playback.",
        3: "The browser could not decode this video. This is usually a codec or container compatibility problem.",
        4: "The browser does not support this video source or codec.",
    };

    return messages[error.code] ?? `Video playback failed with media error ${error.code}.`;
}

function bufferedPercent(video: HTMLVideoElement): number {
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.buffered.length === 0) {
        return 0;
    }

    const end = video.buffered.end(video.buffered.length - 1);

    return Math.max(0, Math.min(100, (end / video.duration) * 100));
}

export function ReplayVideoPlayer(props: ReplayVideoPlayerProps) {
    return <ReplayVideoPlayerContent key={props.src ?? "empty"} {...props} />;
}

function ReplayVideoPlayerContent({src, fps, title, seekCommand, onPlaybackPositionChange, timelineAddon, controlsAddon}: ReplayVideoPlayerProps) {
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const seekTimeoutRef = React.useRef<number | null>(null);
    const lastSeekCommandRef = React.useRef<number | null>(null);
    const positionChangeRef = React.useRef(onPlaybackPositionChange);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [media, setMedia] = React.useState<MediaDiagnostics>(() => initialMediaDiagnostics(src));
    const [currentTime, setCurrentTime] = React.useState(0);
    const effectiveFps = typeof fps === "number" && fps > 0 ? fps : 60;
    const canUseControls = Boolean(src && media.state !== "idle" && media.state !== "loading" && media.state !== "error");

    React.useEffect(() => {
        positionChangeRef.current = onPlaybackPositionChange;
    });

    const publishPlaybackPosition = React.useCallback((seconds: number, durationSeconds: number | null | undefined) => {
        const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
        const safeDurationSeconds = typeof durationSeconds === "number" && Number.isFinite(durationSeconds) ? durationSeconds : 0;
        const nextPosition: PlaybackPosition = {
            timeMs: Math.round(safeSeconds * 1000),
            frame: Math.max(0, Math.round(safeSeconds * effectiveFps)),
            durationMs: Math.round(safeDurationSeconds * 1000),
        };

        positionChangeRef.current?.(nextPosition);
    }, [effectiveFps]);

    const updateCurrentTime = React.useCallback((video: HTMLVideoElement) => {
        setCurrentTime(video.currentTime);
        publishPlaybackPosition(video.currentTime, video.duration);
    }, [publishPlaybackPosition]);

    const captureMediaState = React.useCallback((eventName: string, state: MediaLoadState) => {
        const video = videoRef.current;
        if (!video) {
            setMedia((current) => ({...current, state, lastEvent: eventName}));
            return;
        }

        setMedia({
            state,
            lastEvent: eventName,
            readyState: video.readyState,
            networkState: video.networkState,
            duration: Number.isFinite(video.duration) ? video.duration : null,
            bufferedPercent: bufferedPercent(video),
            errorMessage: state === "error" ? mediaErrorMessage(video.error) : null,
        });
    }, []);

    React.useEffect(() => {
        const video = videoRef.current;
        if (!video || !seekCommand || media.state === "error" || media.state === "loading" || media.state === "idle") {
            return;
        }

        if (lastSeekCommandRef.current === seekCommand.id) {
            return;
        }
        lastSeekCommandRef.current = seekCommand.id;

        if (seekTimeoutRef.current !== null) {
            window.clearTimeout(seekTimeoutRef.current);
        }

        captureMediaState("seek-command", "seeking");
        video.currentTime = Math.max(0, seekCommand.timeMs / 1000);
        updateCurrentTime(video);
        seekTimeoutRef.current = window.setTimeout(() => {
            captureMediaState("seek-timeout", video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA ? "ready" : "stalled");
        }, 5000);
    }, [captureMediaState, media.state, seekCommand, updateCurrentTime]);

    React.useEffect(() => {
        const video = videoRef.current;
        if (!video || !canUseControls || !("requestVideoFrameCallback" in HTMLVideoElement.prototype)) {
            return undefined;
        }

        let callbackId = 0;
        const syncFrameTime = () => {
            updateCurrentTime(video);
            callbackId = video.requestVideoFrameCallback(syncFrameTime);
        };
        callbackId = video.requestVideoFrameCallback(syncFrameTime);

        return () => video.cancelVideoFrameCallback(callbackId);
    }, [canUseControls, src, updateCurrentTime]);

    const seekBy = React.useCallback((seconds: number) => {
        const video = videoRef.current;
        if (!video || !canUseControls) {
            return;
        }

        captureMediaState("manual-seek", "seeking");
        video.currentTime = Math.max(0, Math.min(video.duration || Number.MAX_SAFE_INTEGER, video.currentTime + seconds));
        updateCurrentTime(video);
    }, [canUseControls, captureMediaState, updateCurrentTime]);

    const togglePlayback = React.useCallback(async () => {
        const video = videoRef.current;
        if (!video || !canUseControls) {
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
    }, [canUseControls]);

    const keyboardControlsRef = React.useRef({canUseControls, effectiveFps, seekBy, togglePlayback});

    React.useEffect(() => {
        keyboardControlsRef.current = {canUseControls, effectiveFps, seekBy, togglePlayback};
    });

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const keyboardControls = keyboardControlsRef.current;

            if (!keyboardControls.canUseControls || shouldIgnoreShortcut(event)) {
                return;
            }

            if (event.code === "Space") {
                event.preventDefault();
                void keyboardControls.togglePlayback();
                return;
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                keyboardControls.seekBy(-1);
                return;
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                keyboardControls.seekBy(1);
                return;
            }

            if (event.key === "," || event.key === "[") {
                event.preventDefault();
                keyboardControls.seekBy(-1 / keyboardControls.effectiveFps);
                return;
            }

            if (event.key === "." || event.key === "]") {
                event.preventDefault();
                keyboardControls.seekBy(1 / keyboardControls.effectiveFps);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    React.useEffect(() => {
        return () => {
            if (seekTimeoutRef.current !== null) {
                window.clearTimeout(seekTimeoutRef.current);
            }
        };
    }, []);

    return (
        <AppBox sx={{display: "grid", gap: 1.15}}>
            <AppBox
                sx={(theme) => ({
                    position: "relative",
                    width: {xs: "100%", md: "82%"},
                    mx: "auto",
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: theme.fgc.border.strong,
                    borderRadius: 1.5,
                    backgroundColor: theme.fgc.surface.sunken,
                    display: "grid",
                    placeItems: "center",
                })}
            >
                {src ? (
                    <video
                        ref={videoRef}
                        src={src}
                        controls={canUseControls}
                        preload="metadata"
                        playsInline
                        aria-label={title}
                        onLoadStart={() => captureMediaState("loadstart", "loading")}
                        onLoadedMetadata={(event) => {
                            captureMediaState("loadedmetadata", "metadata");
                            updateCurrentTime(event.currentTarget);
                        }}
                        onLoadedData={(event) => {
                            captureMediaState("loadeddata", "first-frame");
                            updateCurrentTime(event.currentTarget);
                        }}
                        onDurationChange={(event) => {
                            captureMediaState("durationchange", media.state === "idle" ? "loading" : media.state);
                            updateCurrentTime(event.currentTarget);
                        }}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onTimeUpdate={(event) => updateCurrentTime(event.currentTarget)}
                        onProgress={() => captureMediaState("progress", media.state)}
                        onWaiting={() => captureMediaState("waiting", "buffering")}
                        onCanPlay={() => captureMediaState("canplay", "ready")}
                        onSeeking={() => captureMediaState("seeking", "seeking")}
                        onSeeked={(event) => {
                            if (seekTimeoutRef.current !== null) {
                                window.clearTimeout(seekTimeoutRef.current);
                                seekTimeoutRef.current = null;
                            }
                            captureMediaState("seeked", "ready");
                            updateCurrentTime(event.currentTarget);
                        }}
                        onStalled={() => captureMediaState("stalled", "stalled")}
                        onError={() => captureMediaState("error", "error")}
                        style={{width: "100%", maxHeight: "min(58vh, 620px)", display: "block"}}
                    />
                ) : (
                    <AppTypography color="text.secondary">Select a replay to load private playback.</AppTypography>
                )}
            </AppBox>

            <AppBox sx={{display: "grid", gap: 0.85, width: {xs: "100%", md: "82%"}, mx: "auto"}}>
                {timelineAddon}

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

                    <AppTypography variant="body2" color="text.secondary">{canUseControls ? formatPlaybackTime(currentTime) : "Loading video..."}</AppTypography>
                </AppStack>
            </AppBox>
            {media.errorMessage ? <AppTypography variant="body2" color="error">{media.errorMessage}</AppTypography> : null}
            <AppTypography variant="body2" color="text.secondary" sx={{width: {xs: "100%", md: "82%"}, mx: "auto"}}>Playback: Space, Left/Right 1s, [ ] or , . frame step.</AppTypography>
        </AppBox>
    );
}
