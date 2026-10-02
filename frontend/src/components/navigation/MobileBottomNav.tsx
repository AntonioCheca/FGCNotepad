"use client";

import React from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {MoreHorizIcon} from "@/src/components/ui/AppIcons";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {mobileTabs} from "@/src/data/navigationData";
import {findActiveMobileTab} from "@/src/utils/mobileTabs";
import MobileMoreSheet from "./MobileMoreSheet";

export const MOBILE_BOTTOM_NAV_HEIGHT = 60;

const tabSx = (active: boolean) => ({
    flex: 1,
    minWidth: 0,
    minHeight: MOBILE_BOTTOM_NAV_HEIGHT,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 0.25,
    px: 0.5,
    py: 0,
    borderRadius: 0,
    textTransform: "none",
    boxShadow: "none",
    color: (theme: Theme) => (active ? theme.fgc.accent.selected : theme.fgc.icon.muted),
    backgroundColor: "transparent",
    touchAction: "manipulation",
    "&:hover": {backgroundColor: "transparent", boxShadow: "none"},
    "&:focus-visible": {
        outline: "2px solid",
        outlineColor: (theme: Theme) => theme.fgc.focus.outline,
        outlineOffset: -4,
        borderRadius: 2,
    },
    "& svg": {fontSize: 24},
});

function TabLabel({children, active}: {children: React.ReactNode; active: boolean}) {
    return (
        <AppTypography component="span" sx={{fontSize: "0.75rem", lineHeight: 1.2, fontWeight: active ? 650 : 520, color: "inherit"}}>
            {children}
        </AppTypography>
    );
}

export default function MobileBottomNav() {
    const pathname = usePathname() ?? "/";
    const [moreOpen, setMoreOpen] = React.useState(false);
    const activeTab = findActiveMobileTab(pathname, mobileTabs);
    const moreActive = activeTab === null || moreOpen;

    return (
        <>
            <AppBox
                component="nav"
                aria-label="Primary navigation"
                sx={{
                    display: {xs: "flex", md: "none"},
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1200,
                    pb: "env(safe-area-inset-bottom)",
                    borderTop: "1px solid",
                    borderColor: (theme: Theme) => theme.fgc.border.default,
                    backgroundColor: (theme: Theme) => theme.fgc.app.sidebar,
                }}
            >
                {mobileTabs.map((tab) => {
                    const active = tab === activeTab && !moreOpen;
                    return (
                        <AppButton
                            key={tab.href}
                            href={tab.href}
                            LinkComponent={Link}
                            variant="text"
                            color="inherit"
                            aria-current={active ? "page" : undefined}
                            sx={tabSx(active)}
                        >
                            {tab.icon}
                            <TabLabel active={active}>{tab.label}</TabLabel>
                        </AppButton>
                    );
                })}
                <AppButton
                    type="button"
                    variant="text"
                    color="inherit"
                    onClick={() => setMoreOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={moreOpen}
                    sx={tabSx(moreActive)}
                >
                    <MoreHorizIcon/>
                    <TabLabel active={moreActive}>More</TabLabel>
                </AppButton>
            </AppBox>
            <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)}/>
        </>
    );
}
