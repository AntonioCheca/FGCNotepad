import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";

interface SectionCardProps {
    title: string;
    description?: string;
    tone?: "default" | "raised" | "sunken";
    children: React.ReactNode;
}

export function SectionCard({title, description, tone = "default", children}: SectionCardProps) {
    const backgroundColor = tone === "raised"
        ? (theme) => theme.fgc.surface.raised
        : tone === "sunken"
            ? (theme) => theme.fgc.surface.subtle
            : (theme) => theme.fgc.surface.base;

    return (
        <AppBox
            sx={{
                display: "grid",
                gap: 1,
                px: {xs: 1, md: 1.25},
                py: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.25,
                backgroundColor,
            }}
        >
            <AppBox sx={{display: "grid", gap: 0.15}}>
                <AppTypography variant="subtitle1" sx={{fontWeight: 650}}>{title}</AppTypography>
                {description ? <AppTypography variant="body2" color="text.secondary">{description}</AppTypography> : null}
            </AppBox>
            {children}
        </AppBox>
    );
}
