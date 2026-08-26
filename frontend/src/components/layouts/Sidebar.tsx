'use client';

import {AppBox} from '@/src/components/ui/AppBox';
import {AppIconButton} from '@/src/components/ui/AppIconButton';
import NavigationSection from '@/src/components/navigation/NavigationSection';
import {navigationSections} from '@/src/data/navigationData';
import Link from 'next/link';
import {ChevronLeftIcon, ChevronRightIcon, CloseIcon} from '@/src/components/ui/AppIcons';
import ThemeLogo from "@/src/components/ui/ThemeLogo";
import React from "react";
import AuthContext from "@/services/AuthContext";


type SidebarProps = {
    collapsed: boolean;
    mobileOpen: boolean;
    toggleCollapse: () => void;
    closeMobile: () => void;
};

export default function Sidebar({collapsed, mobileOpen, toggleCollapse, closeMobile}: SidebarProps) {
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
        <>
            <AppBox
                onClick={closeMobile}
                aria-hidden="true"
                sx={{
                    display: {xs: mobileOpen ? 'block' : 'none', md: 'none'},
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1199,
                    backgroundColor: 'fgc.overlay.backdrop',
                }}
            />
            <AppBox
                id="primary-navigation"
                component="nav"
                aria-label="Primary navigation"
                sx={{
                    width: {xs: 296, md: collapsed ? 84 : 296},
                    maxWidth: {xs: '82vw', md: 'none'},
                    height: '100dvh',
                    backgroundColor: (theme) => theme.fgc.app.sidebar,
                    borderRight: '1px solid',
                    borderColor: 'fgc.border.default',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1200,
                    transition: 'width 0.28s ease, transform 0.28s ease, visibility 0.28s ease',
                    transform: {xs: mobileOpen ? 'translateX(0)' : 'translateX(-105%)', md: 'translateX(0)'},
                    visibility: {xs: mobileOpen ? 'visible' : 'hidden', md: 'visible'},
                    boxShadow: {xs: mobileOpen ? 8 : 'none', md: 'none'},
                }}
            >
            <AppBox
                sx={{
                    display: 'flex',
                    flexDirection: {xs: 'row', md: collapsed ? 'column' : 'row'},
                    alignItems: 'center',
                    justifyContent: {xs: 'space-between', md: collapsed ? 'center' : 'space-between'},
                    borderBottom: '1px solid',
                    borderColor: 'fgc.border.default',
                    backgroundColor: (theme) => theme.fgc.surface.sunken,
                    px: 2,
                    py: 1,
                    minHeight: {xs: 60, md: collapsed ? 100 : 60},
                    transition: 'min-height 0.3s ease, flex-direction 0.3s ease',
                    gap: 1,
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                }}
            >
                <AppBox
                    sx={{
                        width: {xs: 'auto', md: collapsed ? '100%' : 'auto'},
                        display: 'flex',
                        justifyContent: 'center',
                        transition: 'width 0.3s ease',
                        mb: {xs: 0, md: collapsed ? 1 : 0},
                    }}
                >
                    <Link href="/" style={{textDecoration: 'none'}} onClick={closeMobile}>
                        <AppBox sx={{display: {xs: 'block', md: 'none'}}}>
                            <ThemeLogo collapsed={false}/>
                        </AppBox>
                        <AppBox sx={{display: {xs: 'none', md: 'block'}}}>
                            <ThemeLogo collapsed={collapsed}/>
                        </AppBox>
                    </Link>
                </AppBox>

                <AppBox
                    sx={{
                        width: {xs: 'auto', md: collapsed ? '100%' : 'auto'},
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 1,
                    }}
                >
                    <AppIconButton
                        onClick={toggleCollapse}
                        size="small"
                        aria-label="Toggle sidebar"
                        aria-expanded={!collapsed}
                        sx={{
                            display: {xs: 'none', md: 'inline-flex'},
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
                        onClick={closeMobile}
                        size="small"
                        aria-label="Close navigation"
                        sx={{
                            display: {xs: 'inline-flex', md: 'none'},
                            width: 44,
                            height: 44,
                            border: '1px solid',
                            borderColor: 'fgc.border.subtle',
                            backgroundColor: 'fgc.surface.interactive',
                            '&:hover': {
                                backgroundColor: 'fgc.surface.raised',
                            },
                        }}
                    >
                        <CloseIcon />
                    </AppIconButton>

                </AppBox>
            </AppBox>

            <AppBox sx={{flexGrow: 1, pt: 1.25, pb: 2.5}}>
                {visibleSections.map((section, index) => (
                    <NavigationSection
                        key={section.title}
                        section={section}
                        showDivider={index < visibleSections.length - 1}
                        collapsed={collapsed}
                        onNavigate={closeMobile}
                    />
                ))}
            </AppBox>
            </AppBox>
        </>
    );
}
