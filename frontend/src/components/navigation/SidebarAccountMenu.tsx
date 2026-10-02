"use client";

import React from "react";
import {useRouter} from "next/router";
import AuthContext from "@/services/AuthContext";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppDivider} from "@/src/components/ui/AppDivider";
import {AppListItemButton} from "@/src/components/ui/AppListItemButton";
import {AppListItemIcon} from "@/src/components/ui/AppListItemIcon";
import {AppListItemText} from "@/src/components/ui/AppListItemText";
import {AppMenu} from "@/src/components/ui/AppMenu";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppTooltip} from "@/src/components/ui/AppTooltip";
import {AccountCircleOutlinedIcon, LogoutIcon, UnfoldMoreIcon} from "@/src/components/ui/AppIcons";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {accountNavigationSections} from "@/src/data/navigationData";
import {useVisibleNavigationSections} from "./useVisibleNavigationSections";

interface SidebarAccountMenuProps {
    collapsed: boolean;
    onNavigate?: () => void;
}

const MENU_ID = "sidebar-account-menu";

export default function SidebarAccountMenu({collapsed, onNavigate}: SidebarAccountMenuProps) {
    const authContext = React.useContext(AuthContext);
    const router = useRouter();
    const sections = useVisibleNavigationSections(accountNavigationSections);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const isAuthenticated = authContext?.isAuthenticated ?? false;
    const label = authContext?.user?.username ?? "Account";
    const isActive = sections.some((section) => section.items.some((item) => item.href === router.pathname));

    const closeMenu = () => setAnchorEl(null);

    const navigate = (href: string) => {
        closeMenu();
        onNavigate?.();
        void router.push(href);
    };

    const logout = () => {
        closeMenu();
        onNavigate?.();
        void authContext?.logout();
    };

    const trigger = (
        <AppListItemButton
            onClick={(event) => setAnchorEl(event.currentTarget)}
            aria-haspopup="menu"
            aria-expanded={anchorEl !== null}
            aria-controls={anchorEl ? MENU_ID : undefined}
            aria-label={collapsed ? label : undefined}
            sx={{
                px: {xs: 1.6, md: collapsed ? 1.25 : 1.6},
                py: 1,
                mx: 1,
                borderRadius: 2,
                border: "1px solid",
                borderColor: (theme: Theme) => (isActive ? theme.fgc.accent.selected : "transparent"),
                backgroundColor: (theme: Theme) => (isActive ? theme.fgc.surface.selected : "transparent"),
                justifyContent: {xs: "flex-start", md: collapsed ? "center" : "flex-start"},
                "&:hover": {
                    backgroundColor: (theme: Theme) => theme.fgc.surface.subtle,
                    borderColor: (theme: Theme) => (isActive ? theme.fgc.accent.selected : theme.fgc.border.subtle),
                },
            }}
        >
            <AppListItemIcon
                sx={{
                    minWidth: 0,
                    mr: {xs: 1.5, md: collapsed ? 0 : 1.5},
                    color: (theme: Theme) => (isActive ? theme.fgc.accent.selected : theme.fgc.icon.muted),
                }}
            >
                <AccountCircleOutlinedIcon/>
            </AppListItemIcon>
            <AppListItemText
                primary={label}
                sx={{display: {xs: "block", md: collapsed ? "none" : "block"}, minWidth: 0}}
                primaryTypographyProps={{variant: "body2", fontWeight: 600, noWrap: true}}
            />
            <AppBox sx={{display: {xs: "inline-flex", md: collapsed ? "none" : "inline-flex"}, color: (theme: Theme) => theme.fgc.icon.muted}}>
                <UnfoldMoreIcon fontSize="small"/>
            </AppBox>
        </AppListItemButton>
    );

    return (
        <AppBox
            sx={{
                position: "sticky",
                bottom: 0,
                zIndex: 2,
                py: 1,
                borderTop: "1px solid",
                borderColor: (theme: Theme) => theme.fgc.border.default,
                backgroundColor: (theme: Theme) => theme.fgc.surface.sunken,
            }}
        >
            {collapsed ? <AppTooltip title={label} placement="right">{trigger}</AppTooltip> : trigger}

            <AppMenu
                id={MENU_ID}
                anchorEl={anchorEl}
                open={anchorEl !== null}
                onClose={closeMenu}
                anchorOrigin={{vertical: "top", horizontal: collapsed ? "right" : "left"}}
                transformOrigin={{vertical: "bottom", horizontal: "left"}}
                slotProps={{
                    paper: {
                        sx: {
                            minWidth: 248,
                            mt: collapsed ? 0 : -0.75,
                            ml: {md: collapsed ? 1 : 0},
                            border: "1px solid",
                            borderColor: (theme: Theme) => theme.fgc.border.default,
                            backgroundColor: (theme: Theme) => theme.fgc.surface.raised,
                        },
                    },
                }}
            >
                {sections.flatMap((section, index) => [
                    ...(index > 0 ? [<AppDivider key={`${section.title}-divider`} sx={{my: 0.5}}/>] : []),
                    ...section.items.map((item) => (
                        <AppMenuItem key={item.href} selected={item.href === router.pathname} onClick={() => navigate(item.href)} sx={{minHeight: 44}}>
                            <AppListItemIcon sx={{color: (theme: Theme) => theme.fgc.icon.muted}}>{item.icon}</AppListItemIcon>
                            <AppListItemText primary={item.label} primaryTypographyProps={{variant: "body2"}}/>
                        </AppMenuItem>
                    )),
                ])}
                {isAuthenticated ? [
                    <AppDivider key="logout-divider" sx={{my: 0.5}}/>,
                    <AppMenuItem key="logout" onClick={logout} sx={{minHeight: 44}}>
                        <AppListItemIcon sx={{color: (theme: Theme) => theme.fgc.icon.muted}}><LogoutIcon/></AppListItemIcon>
                        <AppListItemText primary="Log out" primaryTypographyProps={{variant: "body2"}}/>
                    </AppMenuItem>,
                ] : null}
            </AppMenu>
        </AppBox>
    );
}
