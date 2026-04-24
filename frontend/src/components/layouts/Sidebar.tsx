'use client';

import {AppBox} from '@/src/components/ui/AppBox';
import {AppIconButton} from '@/src/components/ui/AppIconButton';
import NavigationSection from '@/src/components/navigation/NavigationSection';
import {navigationSections} from '@/src/data/navigationData';
import Link from 'next/link';
import {Brightness4Icon, Brightness7Icon, ChevronLeftIcon, ChevronRightIcon} from '@/src/components/ui/AppIcons';
import {useMode} from "@/src/context/ThemeContext";
import ThemeLogo from "@/src/components/ui/ThemeLogo";
import React from "react";


type SidebarProps = {
    collapsed: boolean;
    toggleCollapse: () => void;
};

export default function Sidebar({collapsed, toggleCollapse}: SidebarProps) {
    const {mode, toggleColorMode} = useMode();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const syncAuthenticationState = () => {
            setIsAuthenticated(Boolean(localStorage.getItem('jwt')));
        };

        syncAuthenticationState();
        window.addEventListener('storage', syncAuthenticationState);

        return () => {
            window.removeEventListener('storage', syncAuthenticationState);
        };
    }, []);

    const visibleSections = navigationSections
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => !item.requiresAuth || isAuthenticated),
        }))
        .filter((section) => section.items.length > 0);

    return (
        <AppBox
            sx={{
                width: collapsed ? 84 : 296,
                height: '100vh',
                backgroundColor: (theme) => theme.fgc.background.sidebar,
                borderRight: '1px solid',
                borderColor: 'divider',
                position: 'fixed',
                left: 0,
                top: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
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
                    borderColor: 'divider',
                    backgroundColor: (theme) => theme.fgc.background.workspace,
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

                <AppBox
                    sx={{
                        width: collapsed ? '100%' : 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 1,
                    }}
                >
                    <AppIconButton onClick={toggleCollapse} size="small" aria-label="Toggle sidebar">
                        {collapsed ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                    </AppIconButton>

                    <AppIconButton
                        onClick={toggleColorMode}
                        size="small"
                        aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    >
                        {mode === 'light' ? <Brightness4Icon/> : <Brightness7Icon/>}
                    </AppIconButton>
                </AppBox>
            </AppBox>

            <AppBox sx={{flexGrow: 1, pt: 1.5, pb: 2.5}}>
                {visibleSections.map((section, index) => (
                    <NavigationSection
                        key={section.title}
                        section={section}
                        showDivider={!collapsed && index < visibleSections.length - 1}
                        collapsed={collapsed}
                    />
                ))}
            </AppBox>
        </AppBox>
    );
}
