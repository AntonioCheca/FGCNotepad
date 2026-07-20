import React from "react";

import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {ReplayReviewAccess} from "@/src/types/replayLab";

interface ReplayCoachLinkPanelProps {
    shareLabel: string;
    shareExpiresAt: string;
    sharePassword: string;
    sharedReviewUrl: string | null;
    createdShareLink: ReplayReviewAccess | null;
    shareLinks: ReplayReviewAccess[];
    loading: boolean;
    onShareLabelChange: (value: string) => void;
    onShareExpiresAtChange: (value: string) => void;
    onSharePasswordChange: (value: string) => void;
    onGenerateShareLink: () => void;
    onRevokeCoachLink: (shareLinkId: string) => void;
}

export function ReplayCoachLinkPanel({shareLabel, shareExpiresAt, sharePassword, sharedReviewUrl, createdShareLink, shareLinks, loading, onShareLabelChange, onShareExpiresAtChange, onSharePasswordChange, onGenerateShareLink, onRevokeCoachLink}: ReplayCoachLinkPanelProps) {
    return (
        <SectionCard title="Coach link" description="Optional. Share this review with a coach after the YouTube video is loaded." tone="sunken" variant="finalize">
            <AppStack spacing={1}>
                <AppStack direction={{xs: "column", md: "row"}} spacing={1} alignItems={{xs: "stretch", md: "center"}}>
                    <AppTextField label="Label" value={shareLabel} onChange={(event) => onShareLabelChange(event.target.value)} sx={{maxWidth: {md: 240}}} />
                    <AppTextField label="Expires at" type="datetime-local" value={shareExpiresAt} onChange={(event) => onShareExpiresAtChange(event.target.value)} InputLabelProps={{shrink: true}} sx={{maxWidth: {md: 240}}} />
                    <AppTextField label="Optional password" type="password" value={sharePassword} onChange={(event) => onSharePasswordChange(event.target.value)} sx={{maxWidth: {md: 220}}} />
                    <AppButton type="button" variant="outlined" onClick={onGenerateShareLink} disabled={loading}>Create Link</AppButton>
                </AppStack>
                {sharedReviewUrl ? <AppAlert severity="info">Coach link: {sharedReviewUrl}{createdShareLink?.requiresPassword ? " - password required" : ""}</AppAlert> : null}
                {shareLinks.map((link) => (
                    <AppBox key={link.id} sx={(theme) => ({display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr auto"}, gap: 1, alignItems: "center", p: 1, border: "1px solid", borderColor: theme.fgc.border.default, borderRadius: 1.25, backgroundColor: theme.fgc.surface.base})}>
                        <AppTypography variant="body2">{link.label || "Coach link"} - {link.revokedAt ? "Revoked" : "Active"}</AppTypography>
                        <AppButton type="button" variant="outlined" color="error" size="small" disabled={Boolean(link.revokedAt) || loading} onClick={() => onRevokeCoachLink(link.id)}>Revoke</AppButton>
                    </AppBox>
                ))}
            </AppStack>
        </SectionCard>
    );
}
