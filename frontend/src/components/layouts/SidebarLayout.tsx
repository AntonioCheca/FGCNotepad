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
                    flexGrow: 1,
                    marginLeft: `${sidebarWidth}px`,
                    transition: 'margin-left 0.3s',
                    padding: 4,
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
