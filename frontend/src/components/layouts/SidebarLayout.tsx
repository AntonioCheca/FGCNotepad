'use client';

import {useState} from 'react';
import { AppBox } from '@/src/components/ui/AppBox';
import Sidebar from '@/src/components/layouts/Sidebar';
import MobileBottomNav, {MOBILE_BOTTOM_NAV_HEIGHT} from '@/src/components/navigation/MobileBottomNav';

const COLLAPSED_SIDEBAR_WIDTH = 84;
const EXPANDED_SIDEBAR_WIDTH = 296;

export default function SidebarLayout({
                                            children,
                                        }: {
    children?: React.ReactNode;
}) {
    const [desktopCollapsed, setDesktopCollapsed] = useState(true);

    const sidebarWidth = desktopCollapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH;

    return (
        <AppBox sx={{ display: 'flex', minHeight: '100svh' }}>
            <Sidebar
                collapsed={desktopCollapsed}
                toggleCollapse={() => setDesktopCollapsed((current) => !current)}
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
                    padding: {xs: '16px 12px', sm: '20px 18px', md: 3},
                    paddingBottom: {
                        xs: `calc(${MOBILE_BOTTOM_NAV_HEIGHT + 16}px + env(safe-area-inset-bottom))`,
                        sm: `calc(${MOBILE_BOTTOM_NAV_HEIGHT + 20}px + env(safe-area-inset-bottom))`,
                        md: 3,
                    },
                    backgroundColor: (theme) => theme.fgc.background.workspace,
                    boxSizing: 'border-box',
                }}
            >
                {children}
            </AppBox>
            <MobileBottomNav/>
        </AppBox>
    );
}
