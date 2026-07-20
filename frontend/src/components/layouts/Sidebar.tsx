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
import AuthContext from "@/services/AuthContext";


type SidebarProps = {
    collapsed: boolean;
    toggleCollapse: () => void;
};

export default function Sidebar({collapsed, toggleCollapse}: SidebarProps) {
    const {mode, toggleColorMode} = useMode();
    const authContext = React.useContext(AuthContext);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {isAuthenticated, hasRole} = authContext;

    const visibleSections = React.useMemo(() => {
        const sections = [];
        for (const section of navigationSections) {
            const items = section.items.filter((item) => {
                if (item.requiresAuth && !isAuthenticated) {
                    return false;
                }

                if (!item.allowedRoles || item.allowedRoles.length === 0) {
                    return true;
                }

                return item.allowedRoles.some((role) => hasRole(role));
            });

            if (items.length > 0) {
                sections.push({...section, items});
            }
        }

        return sections;
    }, [hasRole, isAuthenticated]);

    return (
        <AppBox
            sx={{
                width: collapsed ? 84 : 296,
                height: '100vh',
                backgroundColor: (theme) => theme.fgc.app.sidebar,
                borderRight: '1px solid',
                borderColor: 'fgc.border.default',
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
                    borderColor: 'fgc.border.default',
                    backgroundColor: (theme) => theme.fgc.surface.sunken,
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
                    <AppIconButton
                        onClick={toggleCollapse}
                        size="small"
                        aria-label="Toggle sidebar"
                        sx={{
                            border: '1px solid',
                            borderColor: 'fgc.border.subtle',
                            backgroundColor: 'fgc.surface.interactive',
                            '&:hover': {
                                backgroundColor: 'fgc.surface.raised',
                            },
                        }}
                    >
                        {collapsed ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                    </AppIconButton>

                    <AppIconButton
                        onClick={toggleColorMode}
                        size="small"
                        aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                        sx={{
                            border: '1px solid',
                            borderColor: 'fgc.border.subtle',
                            backgroundColor: 'fgc.surface.interactive',
                            '&:hover': {
                                backgroundColor: 'fgc.surface.raised',
                            },
                        }}
                    >
                        {mode === 'light' ? <Brightness4Icon/> : <Brightness7Icon/>}
                    </AppIconButton>
                </AppBox>
            </AppBox>

            <AppBox sx={{flexGrow: 1, pt: 1.25, pb: 2.5}}>
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
