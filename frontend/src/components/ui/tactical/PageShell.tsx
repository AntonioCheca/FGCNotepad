import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppChip} from "@/src/components/ui/AppChip";

interface PageShellProps {
    title: string;
    subtitle: string;
    badgeLabel?: string;
    children: React.ReactNode;
}

export function PageShell({title, subtitle, badgeLabel, children}: PageShellProps) {
    return (
        <AppBox sx={{display: "grid", gap: {xs: 1.25, md: 1.5}}}>
            <AppBox sx={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", pb: 1.35, borderBottom: "1px solid", borderColor: "divider"}}>
                <AppBox sx={{display: "grid", gap: 0.45, maxWidth: 860}}>
                    <AppTypography variant="h3">{title}</AppTypography>
                    <AppTypography variant="body1" color="text.secondary">{subtitle}</AppTypography>
                </AppBox>
                {badgeLabel ? <AppChip variant="outlined" size="small" label={badgeLabel} /> : null}
            </AppBox>
            {children}
        </AppBox>
    );
}
