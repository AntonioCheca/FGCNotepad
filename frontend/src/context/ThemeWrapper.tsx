"use client";

import {useMode} from "@/src/context/ThemeContext";
import {AppCssBaseline} from "@/src/components/ui/AppCssBaseline";
import {AppThemeProvider} from "@/src/components/ui/AppTheme";
import Sidebar from "@/src/components/layouts/Sidebar";

export default function ThemeWrapper({children}: { children: React.ReactNode }) {
    const {theme} = useMode();

    return (
        <AppThemeProvider theme={theme}>
            <AppCssBaseline/>
            <div
                style={{
                    display: "flex",
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                }}
            >
                <Sidebar
                    collapsed={false}
                    toggleCollapse={function (): void {
                        throw new Error("Function not implemented.");
                    }}
                />
                <main style={{marginLeft: 296, width: "100%"}}>
                    {children}
                </main>
            </div>
        </AppThemeProvider>
    );
}
