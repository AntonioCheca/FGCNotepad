"use client";

import React from "react";
import AuthContext from "@/services/AuthContext";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppDrawer} from "@/src/components/ui/AppDrawer";
import {AppList} from "@/src/components/ui/AppList";
import {AppListItem} from "@/src/components/ui/AppListItem";
import {AppListItemButton} from "@/src/components/ui/AppListItemButton";
import {AppListItemIcon} from "@/src/components/ui/AppListItemIcon";
import {AppListItemText} from "@/src/components/ui/AppListItemText";
import {LogoutIcon} from "@/src/components/ui/AppIcons";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {accountNavigationSections, mobileTabs, navigationSections} from "@/src/data/navigationData";
import type {NavigationSection as NavigationSectionType} from "@/src/types/navigation";
import NavigationSection from "./NavigationSection";
import {useVisibleNavigationSections} from "./useVisibleNavigationSections";

interface MobileMoreSheetProps {
    open: boolean;
    onClose: () => void;
}

const TAB_HREFS = new Set(mobileTabs.map((tab) => tab.href));

function withoutTabDestinations(sections: NavigationSectionType[]): NavigationSectionType[] {
    return sections.flatMap((section) => {
        const items = section.items.filter((item) => !TAB_HREFS.has(item.href));
        return items.length > 0 ? [{...section, items}] : [];
    });
}

export default function MobileMoreSheet({open, onClose}: MobileMoreSheetProps) {
    const authContext = React.useContext(AuthContext);
    const featureSections = useVisibleNavigationSections(navigationSections);
    const accountSections = useVisibleNavigationSections(accountNavigationSections);
    const sections = React.useMemo(
        () => withoutTabDestinations([...featureSections, ...accountSections]),
        [featureSections, accountSections],
    );

    const logout = () => {
        onClose();
        void authContext?.logout();
    };

    return (
        <AppDrawer
            anchor="bottom"
            open={open}
            onClose={onClose}
            slotProps={{
                paper: {
                    role: "dialog",
                    "aria-modal": true,
                    "aria-label": "More navigation",
                    sx: {
                        maxHeight: "85dvh",
                        overscrollBehavior: "contain",
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        backgroundColor: (theme: Theme) => theme.fgc.app.sidebar,
                        backgroundImage: "none",
                        pt: 1,
                        pb: "calc(12px + env(safe-area-inset-bottom))",
                    },
                },
            }}
        >
            <AppBox aria-hidden="true" sx={{width: 36, height: 4, borderRadius: 2, mx: "auto", mb: 1.5, backgroundColor: (theme: Theme) => theme.fgc.border.strong}}/>
            {sections.map((section, index) => (
                <NavigationSection
                    key={section.title}
                    section={section}
                    showDivider={index < sections.length - 1}
                    collapsed={false}
                    onNavigate={onClose}
                />
            ))}
            {authContext?.isAuthenticated ? (
                <AppList disablePadding>
                    <AppListItem disablePadding>
                        <AppListItemButton onClick={logout} sx={{mx: 1, borderRadius: 2, minHeight: 44}}>
                            <AppListItemIcon sx={{minWidth: 0, mr: 1.5, color: (theme: Theme) => theme.fgc.icon.muted}}><LogoutIcon/></AppListItemIcon>
                            <AppListItemText primary="Log out" primaryTypographyProps={{variant: "body2", fontWeight: 520}}/>
                        </AppListItemButton>
                    </AppListItem>
                </AppList>
            ) : null}
        </AppDrawer>
    );
}
