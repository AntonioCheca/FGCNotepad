import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTypography} from "@/src/components/ui/AppTypography";

type YouTubePlayer = {
    getCurrentTime: () => number;
    getDuration: () => number;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    playVideo: () => void;
    pauseVideo: () => void;
    destroy: () => void;
};

type YouTubeStateChangeEvent = {
    data: number;
};

type YouTubeWindow = Window & {
    YT?: {
        Player: new (elementId: string, options: Record<string, unknown>) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
};

interface ReplayYouTubePlayerProps {
    videoId: string | null | undefined;
    fps: number;
    title: string;
    seekToMs: number | null;
    onPlaybackPositionChange: (position: {timeMs: number; frame: number}) => void;
    controlsAddon?: React.ReactNode;
}

function loadYouTubeApi(): Promise<void> {
    const typedWindow = window as YouTubeWindow;
    if (typedWindow.YT?.Player) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        typedWindow.onYouTubeIframeAPIReady = () => resolve();
        if (!document.querySelector<HTMLScriptElement>("script[src='https://www.youtube.com/iframe_api']")) {
            const script = document.createElement("script");
            script.src = "https://www.youtube.com/iframe_api";
            script.async = true;
            document.body.appendChild(script);
        }
    });
}

function formatSeconds(milliseconds: number): string {
    return `${(milliseconds / 1000).toFixed(3)}s`;
}

function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

export function ReplayYouTubePlayer({videoId, fps, title, seekToMs, onPlaybackPositionChange, controlsAddon}: ReplayYouTubePlayerProps) {
    const playerElementId = React.useId().replace(/:/g, "");
    const playerRef = React.useRef<YouTubePlayer | null>(null);
    const lastSeekRef = React.useRef<number | null>(null);
    const [isReady, setIsReady] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [position, setPosition] = React.useState({timeMs: 0, frame: 0});
    const [durationMs, setDurationMs] = React.useState(0);

    React.useEffect(() => {
        if (!videoId) {
            setIsReady(false);
            setIsPlaying(false);
            return undefined;
        }

        let cancelled = false;
        let createdPlayer: YouTubePlayer | null = null;
        void loadYouTubeApi().then(() => {
            if (cancelled) {
                return;
            }
            const typedWindow = window as YouTubeWindow;
            createdPlayer = new typedWindow.YT!.Player(playerElementId, {
                videoId,
                playerVars: {
                    enablejsapi: 1,
                    origin: window.location.origin,
                    rel: 0,
                    modestbranding: 1,
                },
                events: {
                    onReady: () => {
                        playerRef.current = createdPlayer;
                        setIsReady(true);
                    },
                    onStateChange: (event: YouTubeStateChangeEvent) => {
                        setIsPlaying(event.data === 1);
                    },
                },
            });
        });

        return () => {
            cancelled = true;
            playerRef.current = null;
            createdPlayer?.destroy();
            setIsReady(false);
            setIsPlaying(false);
        };
    }, [playerElementId, videoId]);

    React.useEffect(() => {
        if (!isReady) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            const player = playerRef.current;
            if (!player) {
                return;
            }
            const timeMs = Math.round(player.getCurrentTime() * 1000);
            const nextPosition = {timeMs, frame: Math.round((timeMs / 1000) * fps)};
            setPosition(nextPosition);
            setDurationMs(Math.round(player.getDuration() * 1000));
            onPlaybackPositionChange(nextPosition);
        }, 100);

        return () => window.clearInterval(intervalId);
    }, [fps, isReady, onPlaybackPositionChange]);

    React.useEffect(() => {
        if (!isReady || seekToMs === null || lastSeekRef.current === seekToMs) {
            return;
        }
        lastSeekRef.current = seekToMs;
        playerRef.current?.seekTo(seekToMs / 1000, true);
    }, [isReady, seekToMs]);

    const seekBy = React.useCallback((seconds: number) => {
        const player = playerRef.current;
        if (!player || !isReady) {
            return;
        }
        player.seekTo(Math.max(0, position.timeMs / 1000 + seconds), true);
    }, [isReady, position.timeMs]);

    const togglePlayback = React.useCallback(() => {
        const player = playerRef.current;
        if (!player || !isReady) {
            return;
        }

        if (isPlaying) {
            player.pauseVideo();
            setIsPlaying(false);
            return;
        }

        player.playVideo();
        setIsPlaying(true);
    }, [isPlaying, isReady]);

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isReady || shouldIgnoreShortcut(event)) {
                return;
            }

            if (event.code === "Space") {
                event.preventDefault();
                togglePlayback();
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
                seekBy(-1 / fps);
                return;
            }

            if (event.key === "." || event.key === "]") {
                event.preventDefault();
                seekBy(1 / fps);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [fps, isReady, seekBy, togglePlayback]);

    return (
        <AppBox sx={{display: "grid", gap: 1}}>
            <AppTypography variant="subtitle2" sx={{fontWeight: 650}}>{title}</AppTypography>
            <AppBox sx={(theme) => ({position: "relative", width: "100%", aspectRatio: "16 / 9", backgroundColor: theme.fgc.surface.sunken})}>
                {videoId ? <div id={playerElementId} style={{width: "100%", height: "100%"}} /> : null}
            </AppBox>
            <AppStack direction={{xs: "column", md: "row"}} spacing={0.75} alignItems={{xs: "stretch", md: "center"}} justifyContent="space-between">
                <AppStack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    <AppButton type="button" variant="contained" disabled={!isReady} onClick={togglePlayback}>{isPlaying ? "Pause" : "Play"}</AppButton>
                    <AppButton type="button" variant="outlined" disabled={!isReady} onClick={() => seekBy(-1)}>-1s</AppButton>
                    <AppButton type="button" variant="outlined" disabled={!isReady} onClick={() => seekBy(-1 / fps)}>-1f</AppButton>
                    <AppButton type="button" variant="outlined" disabled={!isReady} onClick={() => seekBy(1 / fps)}>+1f</AppButton>
                    <AppButton type="button" variant="outlined" disabled={!isReady} onClick={() => seekBy(1)}>+1s</AppButton>
                    {controlsAddon}
                </AppStack>
                <AppTypography variant="body2" color="text.secondary">{formatSeconds(position.timeMs)} / {formatSeconds(durationMs)}</AppTypography>
            </AppStack>
            <AppTypography variant="caption" color="text.secondary">Shortcuts: Space play/pause, Left/Right +/-1s, [ ] or , . for fine frame-step seeks.</AppTypography>
        </AppBox>
    );
}
