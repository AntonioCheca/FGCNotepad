// src/styles/ThemeContext.tsx
"use client";

import React, {
    createContext,
    useMemo,
    useState,
    useContext,
    useEffect,
} from "react";
import {
    Theme,
    ThemeProvider as MuiThemeProvider,
    createTheme,
    PaletteMode,
} from "@mui/material";
import {getDesignTokens} from "@/styles/theme";

interface ThemeContextType {
    mode: PaletteMode;
    toggleColorMode: () => void;
    theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeModeProvider = ({children}: { children: React.ReactNode }) => {
    const [mode, setMode] = useState<PaletteMode>("light");

    const toggleColorMode = () => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
    };

    const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

    // ✅ Update <body> background color when theme changes
    useEffect(() => {
        document.body.style.backgroundColor = theme.palette.background.default;
        document.body.style.color = theme.palette.text.primary;
    }, [theme]);

    return (
        <ThemeContext.Provider value={{mode, toggleColorMode, theme}}>
            <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
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
