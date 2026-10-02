'use client';

import {AppBox} from '@/src/components/ui/AppBox';
import {AppIconButton} from '@/src/components/ui/AppIconButton';
import NavigationSection from '@/src/components/navigation/NavigationSection';
import {navigationSections} from '@/src/data/navigationData';
import Link from 'next/link';
import {ChevronLeftIcon, ChevronRightIcon} from '@/src/components/ui/AppIcons';
import ThemeLogo from "@/src/components/ui/ThemeLogo";
import SidebarAccountMenu from "@/src/components/navigation/SidebarAccountMenu";
import {useVisibleNavigationSections} from "@/src/components/navigation/useVisibleNavigationSections";
import type {Theme} from "@/src/components/ui/AppThemeUtils";

type SidebarProps = {
    collapsed: boolean;
    toggleCollapse: () => void;
};

// Desktop navigation. Phones and small tablets use MobileBottomNav instead.
export default function Sidebar({collapsed, toggleCollapse}: SidebarProps) {
    const visibleSections = useVisibleNavigationSections(navigationSections);

    return (
        <AppBox
            component="nav"
            aria-label="Primary navigation"
            sx={{
                width: collapsed ? 84 : 296,
                height: '100dvh',
                backgroundColor: (theme: Theme) => theme.fgc.app.sidebar,
                borderRight: '1px solid',
                borderColor: (theme: Theme) => theme.fgc.border.default,
                position: 'fixed',
                left: 0,
                top: 0,
                overflowY: 'auto',
                display: {xs: 'none', md: 'flex'},
                flexDirection: 'column',
                zIndex: 1200,
                transition: 'width 0.28s ease',
            }}
        >
            <AppBox
                sx={{
                    display: 'flex',
                    flexDirection: collapsed ? 'column' : 'row',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    borderBottom: '1px solid',
                    borderColor: (theme: Theme) => theme.fgc.border.default,
                    backgroundColor: (theme: Theme) => theme.fgc.surface.sunken,
                    px: 2,
                    py: 1,
                    minHeight: collapsed ? 100 : 60,
                    transition: 'min-height 0.3s ease, flex-direction 0.3s ease',
                    gap: 1,
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                }}
            >
                <AppBox
                    sx={{
                        width: collapsed ? '100%' : 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                        transition: 'width 0.3s ease',
                        mb: collapsed ? 1 : 0,
                    }}
                >
                    <Link href="/" style={{textDecoration: 'none'}}>
                        <ThemeLogo collapsed={collapsed}/>
                    </Link>
                </AppBox>

                <AppIconButton
                    onClick={toggleCollapse}
                    size="small"
                    aria-label="Toggle sidebar"
                    aria-expanded={!collapsed}
                    sx={{
                        border: '1px solid',
                        borderColor: (theme: Theme) => theme.fgc.border.subtle,
                        backgroundColor: (theme: Theme) => theme.fgc.surface.interactive,
                        '&:hover': {
                            backgroundColor: (theme: Theme) => theme.fgc.surface.raised,
                        },
                    }}
                >
                    {collapsed ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                </AppIconButton>
            </AppBox>

            <AppBox sx={{flexGrow: 1, pt: 1.25, pb: 2.5}}>
                {visibleSections.map((section, index) => (
                    <NavigationSection
                        key={section.title}
                        section={section}
                        showDivider={index < visibleSections.length - 1}
                        collapsed={collapsed}
                    />
                ))}
            </AppBox>
            <SidebarAccountMenu collapsed={collapsed}/>
        </AppBox>
    );
}
