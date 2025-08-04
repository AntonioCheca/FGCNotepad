// src/components/layouts/Sidebar.tsx
'use client';

import {Box, IconButton} from '@mui/material';
import NavigationSection from '@/src/components/navigation/NavigationSection';
import {navigationSections} from '@/src/data/navigationData';
import Link from 'next/link';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import {useMode} from "@/src/context/ThemeContext";
import ThemeLogo from "@/src/components/ui/ThemeLogo";


type SidebarProps = {
    collapsed: boolean;
    toggleCollapse: () => void;
};

export default function Sidebar({collapsed, toggleCollapse}: SidebarProps) {
    const {mode, toggleColorMode} = useMode();

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
            <Box
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
                <Box
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
                </Box>

                {/* Buttons container */}
                <Box
                    sx={{
                        width: collapsed ? '100%' : 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 1,
                    }}
                >
                    <IconButton onClick={toggleCollapse} size="small" aria-label="Toggle sidebar">
                        {collapsed ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                    </IconButton>

                    <IconButton
                        onClick={toggleColorMode}
                        size="small"
                        aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    >
                        {mode === 'light' ? <Brightness4Icon/> : <Brightness7Icon/>}
                    </IconButton>
                </Box>
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
