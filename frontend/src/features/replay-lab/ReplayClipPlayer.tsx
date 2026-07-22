import React from "react";
import {buildApiUrl} from "@/services/api";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {ReplayClip} from "@/src/types/replayLab";

interface ReplayClipPlayerProps {
    clip: ReplayClip | null;
    title: string;
}

function getErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "response" in error) {
        const status = (error as {response?: {status?: number}}).response?.status;
        if (typeof status === "number") {
            return `Clip playback failed with status ${status}.`;
        }
    }

    return error instanceof Error ? error.message : "Clip playback failed.";
}

export function ReplayClipPlayer({clip, title}: ReplayClipPlayerProps) {
    const playbackUrl = clip ? buildApiUrl(`/replay-clips/${clip.id}/playback`) : null;
    const [loading, setLoading] = React.useState(Boolean(clip));
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        setError(null);
        setLoading(Boolean(clip));
    }, [clip]);

    return (
        <AppBox
            sx={(theme) => ({
                display: "grid",
                placeItems: "center",
                minHeight: 220,
                border: "1px solid",
                borderColor: theme.fgc.border.default,
                borderRadius: 1.25,
                backgroundColor: theme.fgc.surface.sunken,
                overflow: "hidden",
            })}
        >
            {!clip ? <AppTypography color="text.secondary">No exported clip attached.</AppTypography> : null}
            {loading ? <AppCircularProgress size={24} /> : null}
            {error ? <AppAlert severity="warning" sx={{m: 1}}>{error}</AppAlert> : null}
            {playbackUrl ? (
                <video
                    src={playbackUrl}
                    controls
                    preload="metadata"
                    playsInline
                    aria-label={title}
                    onCanPlay={() => setLoading(false)}
                    onLoadedMetadata={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        setError(getErrorMessage(new Error("Clip playback failed.")));
                    }}
                    style={{width: "100%", maxHeight: 360, display: "block", backgroundColor: "black"}}
                />
            ) : null}
        </AppBox>
    );
}
