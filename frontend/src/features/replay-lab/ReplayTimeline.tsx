import {AppBox} from "@/src/components/ui/AppBox";
import type {ReplayAnnotation} from "@/src/types/replayLab";

interface ReplayTimelineProps {
    annotations: ReplayAnnotation[];
    clipStartMs: number | null;
    clipEndMs: number | null;
    cursorMs: number;
    durationMs: number;
    onSeek: (timeMs: number) => void;
}

function formatTimestamp(milliseconds: number): string {
    return `${(milliseconds / 1000).toFixed(3)}s`;
}

function humanizeCategory(category: string): string {
    return category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function percentageAt(milliseconds: number, durationMs: number): number {
    if (durationMs <= 0) {
        return 0;
    }

    return Math.max(0, Math.min(100, (milliseconds / durationMs) * 100));
}

export function ReplayTimeline({annotations, clipStartMs, clipEndMs, cursorMs, durationMs, onSeek}: ReplayTimelineProps) {
    const draftStart = clipStartMs !== null && clipEndMs !== null ? Math.min(clipStartMs, clipEndMs) : null;
    const draftEnd = clipStartMs !== null && clipEndMs !== null ? Math.max(clipStartMs, clipEndMs) : null;

    return (
        <AppBox sx={{display: "grid"}}>
            <AppBox
                role="slider"
                aria-label="Replay timeline"
                aria-valuemin={0}
                aria-valuemax={Math.max(0, durationMs)}
                aria-valuenow={Math.max(0, Math.min(durationMs, cursorMs))}
                tabIndex={0}
                onClick={(event) => {
                    if (durationMs <= 0) {
                        return;
                    }
                    const rect = event.currentTarget.getBoundingClientRect();
                    onSeek(Math.round(((event.clientX - rect.left) / rect.width) * durationMs));
                }}
                sx={(theme) => ({
                    position: "relative",
                    height: 18,
                    overflow: "hidden",
                    cursor: durationMs > 0 ? "pointer" : "default",
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: theme.fgc.border.strong,
                    backgroundColor: theme.fgc.surface.sunken,
                    boxShadow: `inset 0 0 0 1px ${theme.fgc.border.default}`,
                })}
            >
                {annotations.map((annotation) => {
                    const left = percentageAt(annotation.startTimeMs, durationMs);
                    const width = Math.max(0.6, percentageAt(annotation.endTimeMs - annotation.startTimeMs, durationMs));

                    return (
                        <AppBox
                            key={annotation.id}
                            title={`${annotation.title || humanizeCategory(annotation.category)} ${formatTimestamp(annotation.startTimeMs)} - ${formatTimestamp(annotation.endTimeMs)}`}
                            sx={(theme) => ({
                                position: "absolute",
                                top: 2,
                                bottom: 2,
                                left: `${left}%`,
                                width: `${width}%`,
                                borderRadius: 999,
                                backgroundColor: annotation.exportedClip ? theme.fgc.feedback.success : theme.fgc.selection.active,
                                border: `1px solid ${annotation.exportedClip ? theme.fgc.feedback.success : theme.fgc.focus.outline}`,
                            })}
                        />
                    );
                })}
                {draftStart !== null && draftEnd !== null ? (
                    <AppBox
                        title={`Draft ${formatTimestamp(draftStart)} - ${formatTimestamp(draftEnd)}`}
                        sx={(theme) => ({
                            position: "absolute",
                            top: 1,
                            bottom: 1,
                            left: `${percentageAt(draftStart, durationMs)}%`,
                            width: `${Math.max(0.8, percentageAt(draftEnd - draftStart, durationMs))}%`,
                            borderRadius: 999,
                            backgroundColor: theme.fgc.feedback.warning,
                            border: `1px solid ${theme.fgc.feedback.warning}`,
                            boxShadow: `0 0 0 2px ${theme.fgc.surface.base}`,
                        })}
                    />
                ) : null}
                {clipStartMs !== null && clipEndMs === null ? (
                    <AppBox
                        title={`Start ${formatTimestamp(clipStartMs)}`}
                        sx={(theme) => ({
                            position: "absolute",
                            top: -1,
                            bottom: -1,
                            left: `${percentageAt(clipStartMs, durationMs)}%`,
                            width: 3,
                            borderRadius: 999,
                            backgroundColor: theme.fgc.feedback.warning,
                            boxShadow: `0 0 0 1px ${theme.fgc.surface.base}, 0 0 10px ${theme.fgc.feedback.warning}`,
                        })}
                    />
                ) : null}
                <AppBox
                    sx={(theme) => ({
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: `${percentageAt(cursorMs, durationMs)}%`,
                        width: 2,
                        backgroundColor: theme.fgc.action.primary,
                        boxShadow: `0 0 0 1px ${theme.fgc.surface.base}`,
                    })}
                />
            </AppBox>
        </AppBox>
    );
}
