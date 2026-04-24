import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {BoltIcon, CheckCircleOutlineIcon, PendingActionsIcon} from "@/src/components/ui/AppIcons";
import type {Theme} from "@/src/components/ui/AppTheme";

interface SectionCardProps {
    title: string;
    description?: string;
    tone?: "default" | "raised" | "sunken";
    variant?: "default" | "input" | "review" | "finalize";
    children: React.ReactNode;
}

export function SectionCard({title, description, tone = "default", variant = "default", children}: SectionCardProps) {
    const cardBackground = tone === "raised"
        ? (theme) => theme.fgc.surface.raised
        : tone === "sunken"
            ? (theme) => theme.fgc.surface.sunken
            : (theme) => theme.fgc.surface.base;

    const accentColor = (theme: Theme) => (
        variant === "input"
            ? theme.fgc.accent.parser
            : variant === "review"
                ? theme.fgc.accent.selected
                : variant === "finalize"
                    ? theme.fgc.accent.primary
                    : theme.fgc.border.strong
    );

    const headerIcon = variant === "input"
        ? <BoltIcon fontSize="small" />
        : variant === "review"
            ? <PendingActionsIcon fontSize="small" />
            : variant === "finalize"
                ? <CheckCircleOutlineIcon fontSize="small" />
                : null;

    return (
        <AppBox
            sx={{
                display: "grid",
                gap: variant === "finalize" ? 1.2 : 1.1,
                px: {xs: 1.2, md: 1.55},
                py: {xs: 1.15, md: 1.35},
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                backgroundColor: cardBackground,
                borderTopWidth: 2,
                borderTopColor: accentColor,
            }}
        >
            <AppBox sx={{display: "grid", gap: 0.2, pb: 0.15}}>
                <AppBox sx={{display: "flex", alignItems: "center", gap: 0.65, minHeight: 26}}>
                    {headerIcon ? <AppBox sx={{display: "inline-flex", color: accentColor}}>{headerIcon}</AppBox> : null}
                    <AppTypography variant="subtitle1" sx={{fontWeight: 650}}>{title}</AppTypography>
                </AppBox>
                {description ? <AppTypography variant="body2" color="text.secondary">{description}</AppTypography> : null}
            </AppBox>
            {children}
        </AppBox>
    );
}
