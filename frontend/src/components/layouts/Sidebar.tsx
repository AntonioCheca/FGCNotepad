// src/components/layouts/Sidebar.tsx
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
                width: collapsed ? 80 : 280,
                height: '100vh',
                backgroundColor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider',
                position: 'fixed',
                left: 0,
                top: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                transition: 'width 0.3s ease',
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
                    backgroundColor: 'background.default',
                    px: 2,
                    py: 1,
                    minHeight: collapsed ? 96 : 56,
                    transition: 'min-height 0.3s ease, flex-direction 0.3s ease',
                    gap: 1,
                }}
            >
                {/* Logo container */}
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

                {/* Buttons container */}
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


            {/* Navigation Sections */}
            <AppBox sx={{flexGrow: 1, pt: 2}}>
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
