'use client';

import { useState } from 'react';
import { AppBox } from '@/src/components/ui/AppBox';
import Sidebar from '@/src/components/layouts/Sidebar';

export default function SidebarLayout({
                                           children,
                                       }: {
    children?: React.ReactNode;
}) {
    const collapsedState = useState(false);
    const collapsed = collapsedState[0];
    const setCollapsed = collapsedState[1];

    const sidebarWidth = collapsed ? 84 : 296;

    return (
        <AppBox sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} />
            <AppBox
                component="main"
                sx={{
                    marginLeft: `${sidebarWidth}px`,
                    width: `calc(100% - ${sidebarWidth}px)`,
                    maxWidth: `calc(100% - ${sidebarWidth}px)`,
                    minWidth: 0,
                    transition: 'margin-left 0.28s',
                    padding: {xs: 2, md: 3},
                    backgroundColor: (theme) => theme.fgc.background.workspace,
                    boxSizing: 'border-box',
                }}
            >
                {children}
            </AppBox>
        </AppBox>
    );
}
