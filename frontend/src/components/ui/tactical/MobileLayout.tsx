import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ChevronRightIcon} from "@/src/components/ui/AppIcons";
import type {Theme} from "@/src/components/ui/AppThemeUtils";

// Both wrappers use `display: contents` from md up, so desktop layout and order stay exactly as written.

interface MobileOrderProps {
    order: number;
    children: React.ReactNode;
}

// Re-orders a section inside a grid/flex parent on phones only.
export function MobileOrder({order, children}: MobileOrderProps) {
    return (
        <AppBox sx={{order: {xs: order, md: 0}, display: {xs: "block", md: "contents"}, minWidth: 0}}>
            {children}
        </AppBox>
    );
}

interface MobileCollapsibleProps {
    title: string;
    order?: number;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

// Secondary sections collapse behind a header on phones; children stay mounted so state is preserved.
export function MobileCollapsible({title, order = 0, defaultOpen = false, children}: MobileCollapsibleProps) {
    const [open, setOpen] = React.useState(defaultOpen);
    const contentId = React.useId();

    return (
        <AppBox sx={{order: {xs: order, md: 0}, display: {xs: "grid", md: "contents"}, gap: 1, minWidth: 0}}>
            <AppButton
                type="button"
                variant="text"
                color="inherit"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                aria-controls={contentId}
                sx={{
                    display: {xs: "flex", md: "none"},
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    minHeight: 48,
                    px: 1.5,
                    textTransform: "none",
                    border: "1px solid",
                    borderColor: (theme: Theme) => theme.fgc.border.default,
                    borderRadius: 1.5,
                    backgroundColor: (theme: Theme) => theme.fgc.surface.base,
                    boxShadow: "none",
                    "&:hover": {backgroundColor: (theme: Theme) => theme.fgc.surface.subtle, boxShadow: "none"},
                }}
            >
                <AppTypography component="span" variant="subtitle1" sx={{fontWeight: 650}}>{title}</AppTypography>
                <ChevronRightIcon sx={{transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s ease"}}/>
            </AppButton>
            <AppBox id={contentId} sx={{display: {xs: open ? "grid" : "none", md: "contents"}, gap: 1, minWidth: 0}}>
                {children}
            </AppBox>
        </AppBox>
    );
}
