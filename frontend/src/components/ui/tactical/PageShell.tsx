import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppChip} from "@/src/components/ui/AppChip";

interface PageShellProps {
    title: string;
    subtitle?: string;
    badgeLabel?: string;
    children: React.ReactNode;
}

export function PageShell({title, subtitle, badgeLabel, children}: PageShellProps) {
    return (
        <AppBox sx={{display: "grid", gap: {xs: 1.15, md: 1.5}, minWidth: 0, maxWidth: "100%"}}>
            <AppBox sx={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", pb: {xs: 1, md: 1.35}, borderBottom: "1px solid", borderColor: "divider", minWidth: 0}}>
                <AppBox sx={{display: "grid", gap: 0.45, maxWidth: 860, minWidth: 0}}>
                    <AppTypography variant="h3" sx={{fontSize: {xs: "clamp(1.7rem, 9vw, 2.25rem)", md: undefined}, lineHeight: {xs: 1.02, md: undefined}}}>{title}</AppTypography>
                    {subtitle ? <AppTypography variant="body1" color="text.secondary">{subtitle}</AppTypography> : null}
                </AppBox>
                {badgeLabel ? <AppChip variant="outlined" size="small" label={badgeLabel} /> : null}
            </AppBox>
            {children}
        </AppBox>
    );
}
