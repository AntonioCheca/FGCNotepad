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
        <AppBox sx={{display: "grid", gap: 1.5}}>
            <AppBox sx={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", pb: 1.25, borderBottom: "1px solid", borderColor: "divider"}}>
                <AppBox sx={{display: "grid", gap: 0.25, maxWidth: 760}}>
                    <AppTypography variant="h4">{title}</AppTypography>
                    <AppTypography variant="body2" color="text.secondary">{subtitle}</AppTypography>
                </AppBox>
                {badgeLabel ? <AppChip variant="outlined" size="small" label={badgeLabel} /> : null}
            </AppBox>
            {children}
        </AppBox>
    );
}
