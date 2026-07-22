import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {formatUtcDateTime} from "@/src/utils/formatDateTime";
import {ReplayLabLimits, ReplayReviewSession} from "@/src/types/replayLab";
import {formatBytes, WorkflowMode} from "../replayReviewUtils";

type ReplayReviewRouteMode = "local" | "upload";

interface ReplayReviewLauncherProps {
    limits: ReplayLabLimits | null;
    sessions: ReplayReviewSession[];
    localSourceFile: File | null;
    youtubeUrl: string;
    youtubeTitle: string;
    loading: boolean;
    startingWorkflow: WorkflowMode | null;
    routeMode: ReplayReviewRouteMode;
    onLocalSourceFileChange: (file: File | null) => void;
    onYoutubeUrlChange: (value: string) => void;
    onYoutubeTitleChange: (value: string) => void;
    onStartLocalReview: (event: React.FormEvent) => void;
    onStartYouTubeReview: (event: React.FormEvent) => void;
    onOpenReviewSession: (session: ReplayReviewSession) => void;
    onRemoveSession: (sessionId: string) => void;
}

export function ReplayReviewLauncher({
    limits,
    sessions,
    localSourceFile,
    youtubeUrl,
    youtubeTitle,
    loading,
    startingWorkflow,
    routeMode,
    onLocalSourceFileChange,
    onYoutubeUrlChange,
    onYoutubeTitleChange,
    onStartLocalReview,
    onStartYouTubeReview,
    onOpenReviewSession,
    onRemoveSession,
}: ReplayReviewLauncherProps) {
    const visibleSessions = sessions.filter((session) => routeMode === "local" ? session.video?.sourceType === "local_file" : session.video?.sourceType === "youtube");

    return (
        <AppBox sx={{display: "grid", gap: 1.5}}>
            <SectionCard title="Source File" tone="raised" variant="input">
                <AppStack spacing={1.1}>
                    {limits ? <AppAlert severity="info">Exports are limited to {limits.maxClipDurationSeconds}s clips. Original videos are not uploaded.</AppAlert> : null}
                    <AppStack direction={{xs: "column", sm: "row"}} spacing={1} alignItems={{xs: "stretch", sm: "center"}}>
                        <AppButton type="button" component="label" variant="outlined">
                            Select Local MP4
                            <input hidden type="file" accept="video/mp4,.mp4" onChange={(event) => onLocalSourceFileChange(event.target.files?.[0] ?? null)} />
                        </AppButton>
                        <AppTypography color="text.secondary">
                            {localSourceFile ? `${localSourceFile.name} (${formatBytes(localSourceFile.size)})` : "No local source selected"}
                        </AppTypography>
                    </AppStack>
                </AppStack>
            </SectionCard>

            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", lg: "1fr 1fr"}, gap: 1.5}}>
                {routeMode === "local" ? (
                    <SectionCard title="Local Review" tone="raised" variant="review">
                        <AppBox component="form" onSubmit={onStartLocalReview} sx={{display: "grid", gap: 1}}>
                            <AppButton type="submit" disabled={loading || !localSourceFile || startingWorkflow !== null}>
                                {startingWorkflow === "local" ? "Opening..." : "Start Local Review"}
                            </AppButton>
                        </AppBox>
                    </SectionCard>
                ) : null}

                {routeMode === "upload" ? (
                    <SectionCard title="Online Review" tone="raised" variant="input">
                        <AppBox component="form" onSubmit={onStartYouTubeReview} sx={{display: "grid", gap: 1}}>
                            <AppTextField label="YouTube URL or video ID" value={youtubeUrl} onChange={(event) => onYoutubeUrlChange(event.target.value)} />
                            <AppTextField label="Review title" value={youtubeTitle} onChange={(event) => onYoutubeTitleChange(event.target.value)} placeholder="Optional" />
                            <AppButton type="submit" disabled={loading || !localSourceFile || !youtubeUrl.trim() || startingWorkflow !== null}>
                                {startingWorkflow === "coaching" ? "Opening..." : "Start Online Review"}
                            </AppButton>
                        </AppBox>
                    </SectionCard>
                ) : null}
            </AppBox>

            <SectionCard title="Resume Draft" tone="sunken" variant="finalize">
                <AppStack spacing={1}>
                    {visibleSessions.length === 0 ? <AppTypography color="text.secondary">No review drafts yet.</AppTypography> : null}
                    {visibleSessions.map((session) => {
                        const video = session.video;
                        const label = video?.sourceType === "youtube" ? "Coaching" : video?.sourceType === "local_file" ? "Local" : "Legacy";

                        return (
                            <AppBox key={session.id} sx={(theme) => ({display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr auto"}, gap: 1, alignItems: "center", p: 1, border: "1px solid", borderColor: theme.fgc.border.default, borderRadius: 1.25, backgroundColor: theme.fgc.surface.base})}>
                                <AppBox>
                                    <AppTypography variant="subtitle2">{session.title}</AppTypography>
                                    <AppTypography variant="body2" color="text.secondary">{label}{video ? ` - ${video.originalFilename}` : ""} - Updated {formatUtcDateTime(session.updatedAt, "No expiry")}</AppTypography>
                                </AppBox>
                                <AppStack direction="row" spacing={0.75} justifyContent={{xs: "flex-start", md: "flex-end"}} flexWrap="wrap" useFlexGap>
                                    <AppButton type="button" variant="outlined" onClick={() => onOpenReviewSession(session)} disabled={loading || !video || session.status === "archived"}>Open</AppButton>
                                    <AppButton type="button" variant="outlined" color="error" onClick={() => onRemoveSession(session.id)} disabled={loading || session.status === "saved"}>Delete Draft</AppButton>
                                </AppStack>
                            </AppBox>
                        );
                    })}
                </AppStack>
            </SectionCard>
        </AppBox>
    );
}
