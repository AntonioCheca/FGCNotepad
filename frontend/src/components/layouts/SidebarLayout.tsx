// src/components/layouts/SidebarLayout.tsx
'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from '@/src/components/layouts/Sidebar';

export default function SidebarLayout({
                                          children,
                                      }: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);

    const sidebarWidth = collapsed ? 80 : 280;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} />
            <Box
                component="main"
                sx={{
                    marginLeft: `${sidebarWidth}px`,
                    width: `calc(100% - ${sidebarWidth}px)`,
                    maxWidth: `calc(100% - ${sidebarWidth}px)`,
                    minWidth: 0,
                    transition: 'margin-left 0.3s',
                    padding: 4,
                    boxSizing: 'border-box',
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
