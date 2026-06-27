import React from "react";
import {useReplayLab} from "@/hooks/useReplayLab";
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
    const {fetchClipPlaybackBlob} = useReplayLab();
    const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;
        setError(null);
        setObjectUrl((current) => {
            if (current) {
                URL.revokeObjectURL(current);
            }
            return null;
        });

        if (!clip) {
            return () => {
                cancelled = true;
            };
        }

        setLoading(true);
        void fetchClipPlaybackBlob(clip.id)
            .then((blob) => {
                if (!cancelled) {
                    setObjectUrl(URL.createObjectURL(blob));
                }
            })
            .catch((caughtError: unknown) => {
                if (!cancelled) {
                    setError(getErrorMessage(caughtError));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [clip, fetchClipPlaybackBlob]);

    React.useEffect(() => {
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [objectUrl]);

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
            {objectUrl ? (
                <video
                    src={objectUrl}
                    controls
                    playsInline
                    aria-label={title}
                    style={{width: "100%", maxHeight: 360, display: "block", backgroundColor: "black"}}
                />
            ) : null}
        </AppBox>
    );
}
