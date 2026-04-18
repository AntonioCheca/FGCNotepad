// src/components/ThemeWrapper.tsx
"use client";

import {useMode} from "@/src/context/ThemeContext";
import {AppCssBaseline, AppThemeProvider} from "@/src/components/ui/AppTheme";
import Sidebar from "@/src/components/layouts/Sidebar";

export default function ThemeWrapper({children}: { children: React.ReactNode }) {
    const {theme} = useMode(); // ✅ safe here because this file runs on the client

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
                <main style={{marginLeft: 280, width: "100%"}}>
                    {children}
                </main>
            </div>
        </AppThemeProvider>
    );
}
