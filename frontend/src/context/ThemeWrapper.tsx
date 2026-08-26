"use client";

import {AppCssBaseline} from "@/src/components/ui/AppCssBaseline";
import {AppThemeProvider} from "@/src/components/ui/AppTheme";
import SidebarLayout from "@/src/components/layouts/SidebarLayout";
import {useMode} from "@/src/context/ThemeContext";

export default function ThemeWrapper({children}: { children: React.ReactNode }) {
    const {theme} = useMode();

    return (
        <AppThemeProvider theme={theme}>
            <AppCssBaseline/>
            <SidebarLayout>{children}</SidebarLayout>
        </AppThemeProvider>
    );
}
