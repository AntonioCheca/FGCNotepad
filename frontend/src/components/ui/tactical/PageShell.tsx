import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppChip} from "@/src/components/ui/AppChip";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";

interface PageShellProps {
    title: string;
    subtitle?: string;
    badgeLabel?: string;
    desktopOnly?: boolean;
    children: React.ReactNode;
}

export function PageShell({title, subtitle, badgeLabel, desktopOnly = false, children}: PageShellProps) {
    return (
        <AppBox sx={{display: "grid", gap: {xs: 1.15, md: 1.5}, minWidth: 0, maxWidth: "100%"}}>
            <AppBox sx={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", pb: {xs: 1, md: 1.35}, borderBottom: "1px solid", borderColor: "divider", minWidth: 0}}>
                <AppBox sx={{display: "grid", gap: 0.45, maxWidth: 860, minWidth: 0}}>
                    <AppTypography variant="h3" sx={{fontSize: {xs: "clamp(1.5rem, 7vw, 1.875rem)", md: undefined}, lineHeight: {xs: 1.12, md: undefined}, overflowWrap: "anywhere"}}>{title}</AppTypography>
                    {subtitle ? <AppTypography variant="body1" color="text.secondary">{subtitle}</AppTypography> : null}
                </AppBox>
                {badgeLabel ? <AppChip variant="outlined" size="small" label={badgeLabel} /> : null}
            </AppBox>
            {desktopOnly ? (
                <AppBox sx={{display: {xs: "block", md: "none"}}}>
                    <InlineNotice severity="info">This admin tool is built for desktop. Some controls may not fit on a phone.</InlineNotice>
                </AppBox>
            ) : null}
            {children}
        </AppBox>
    );
}
