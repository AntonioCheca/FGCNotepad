"use client";

import React, {
    createContext,
    useMemo,
    useContext,
    useEffect,
} from "react";
import {
    AppThemeProvider,
} from "@/src/components/ui/AppTheme";
import {createAppTheme, type PaletteMode, type Theme} from "@/src/components/ui/AppThemeUtils";
import {getDesignTokens} from "@/styles/theme";

const APP_THEME_MODE: PaletteMode = "dark";

interface ThemeContextType {
    mode: PaletteMode;
    theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeModeProvider = ({children}: { children: React.ReactNode }) => {
    const theme = useMemo(() => createAppTheme(getDesignTokens(APP_THEME_MODE)), []);
    const contextValue = useMemo<ThemeContextType>(() => ({mode: APP_THEME_MODE, theme}), [theme]);

    useEffect(() => {
        document.body.style.backgroundColor = theme.palette.background.default;
        document.body.style.color = theme.palette.text.primary;
        document.documentElement.dataset.fgcThemeMode = APP_THEME_MODE;
        document.documentElement.style.backgroundColor = theme.palette.background.default;
        document.documentElement.style.color = theme.palette.text.primary;
    }, [theme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            <AppThemeProvider theme={theme}>{children}</AppThemeProvider>
        </ThemeContext.Provider>
    );
};

export const useMode = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useMode must be used within a ThemeModeProvider");
    }
    return context;
};
