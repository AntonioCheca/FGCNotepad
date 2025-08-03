// src/components/layouts/Sidebar.tsx
'use client';

import {Box, IconButton} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Logo from '@/src/components/ui/Logo';
import NavigationSection from '@/src/components/navigation/NavigationSection';
import {navigationSections} from '@/src/data/navigationData';
import Link from 'next/link';
import Image from 'next/image';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';


type SidebarProps = {
    collapsed: boolean;
    toggleCollapse: () => void;
};

export default function Sidebar({collapsed, toggleCollapse}: SidebarProps) {
    return (
        <Box
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
            {/* Logo and toggle */}
            <Box
                sx={{
                    p: 2,
                    textAlign: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.default',
                }}
            >
                <Link href="/" style={{textDecoration: 'none'}}>
                    <Image
                        src="/logos/favicon-color-neg.svg"
                        alt="Logo"
                        width={collapsed ? 32 : 120}
                        height={collapsed ? 32 : 40}
                        style={{margin: '0 auto'}}
                    />
                </Link>
                <IconButton onClick={toggleCollapse} size="small" sx={{mt: 1}}>
                    {collapsed ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                </IconButton>
            </Box>

            {/* Navigation Sections */}
            <Box sx={{flexGrow: 1, pt: 2}}>
                {navigationSections.map((section, index) => (
                    <NavigationSection
                        key={section.title}
                        section={section}
                        showDivider={!collapsed && index < navigationSections.length - 1}
                        collapsed={collapsed}
                    />
                ))}
            </Box>
        </Box>
    );
}
