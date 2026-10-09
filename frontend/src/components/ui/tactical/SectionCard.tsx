import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {Theme} from "@/src/components/ui/AppThemeUtils";

interface SectionCardProps {
    title?: string;
    description?: string;
    tone?: "default" | "raised" | "sunken";
    children: React.ReactNode;
}

export function SectionCard({title, description, tone = "default", children}: SectionCardProps) {
    const cardBackground = tone === "raised"
        ? (theme: Theme) => theme.fgc.surface.raised
        : tone === "sunken"
            ? (theme: Theme) => theme.fgc.surface.sunken
            : (theme: Theme) => theme.fgc.surface.base;

    return (
        <AppBox
            sx={{
                display: "grid",
                gap: 1.1,
                px: {xs: 1, sm: 1.2, md: 1.55},
                py: {xs: 1, sm: 1.15, md: 1.35},
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                backgroundColor: cardBackground,
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
            }}
        >
            {title || description ? (
                <AppBox sx={{display: "grid", gap: 0.2, pb: 0.15, minWidth: 0}}>
                    {title ? <AppTypography variant="subtitle1" sx={{fontWeight: 650}}>{title}</AppTypography> : null}
                    {description ? <AppTypography variant="body2" color="text.secondary">{description}</AppTypography> : null}
                </AppBox>
            ) : null}
            {children}
        </AppBox>
    );
}
