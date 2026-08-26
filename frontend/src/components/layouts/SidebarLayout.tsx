'use client';

import {useState} from 'react';
import { AppBox } from '@/src/components/ui/AppBox';
import {AppIconButton} from '@/src/components/ui/AppIconButton';
import Sidebar from '@/src/components/layouts/Sidebar';
import {MenuIcon} from '@/src/components/ui/AppIcons';

const COLLAPSED_SIDEBAR_WIDTH = 84;
const EXPANDED_SIDEBAR_WIDTH = 296;

export default function SidebarLayout({
                                            children,
                                        }: {
    children?: React.ReactNode;
}) {
    const [desktopCollapsed, setDesktopCollapsed] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    const sidebarWidth = desktopCollapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH;

    return (
        <AppBox sx={{ display: 'flex', minHeight: '100svh' }}>
            <AppIconButton
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
                sx={{
                    display: {xs: 'inline-flex', md: 'none'},
                    position: 'fixed',
                    top: 12,
                    left: 12,
                    zIndex: 1201,
                    width: 44,
                    height: 44,
                    border: '1px solid',
                    borderColor: 'fgc.border.default',
                    backgroundColor: 'fgc.surface.raised',
                    color: 'text.primary',
                    '&:hover': {
                        backgroundColor: 'fgc.surface.subtle',
                    },
                }}
            >
                <MenuIcon />
            </AppIconButton>
            <Sidebar
                collapsed={desktopCollapsed}
                mobileOpen={mobileOpen}
                toggleCollapse={() => setDesktopCollapsed((current) => !current)}
                closeMobile={() => setMobileOpen(false)}
            />
            <AppBox
                component="main"
                sx={{
                    marginLeft: {xs: 0, md: `${sidebarWidth}px`},
                    width: {xs: '100%', md: `calc(100% - ${sidebarWidth}px)`},
                    maxWidth: {xs: '100%', md: `calc(100% - ${sidebarWidth}px)`},
                    minWidth: 0,
                    minHeight: '100svh',
                    transition: 'margin-left 0.28s',
                    padding: {xs: '68px 12px 16px', sm: '72px 18px 20px', md: 3},
                    backgroundColor: (theme) => theme.fgc.background.workspace,
                    boxSizing: 'border-box',
                }}
            >
                {children}
            </AppBox>
        </AppBox>
    );
}
