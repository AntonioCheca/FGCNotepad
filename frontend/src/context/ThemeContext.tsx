"use client";

import React, {
    createContext,
    useCallback,
    useMemo,
    useState,
    useContext,
    useEffect,
} from "react";
import {
    AppThemeProvider,
} from "@/src/components/ui/AppTheme";
import {createAppTheme, type PaletteMode, type Theme} from "@/src/components/ui/AppThemeUtils";
import {getDesignTokens} from "@/styles/theme";
import {THEME_STORAGE_KEY} from "@/src/context/themeModeScript";

const isPaletteMode = (value: string | null): value is PaletteMode => {
    return value === "light" || value === "dark";
};

const resolveBrowserMode = (): PaletteMode => {
    if (typeof window === "undefined") {
        return "light";
    }

    const storedMode = localStorage.getItem(THEME_STORAGE_KEY);
    if (isPaletteMode(storedMode)) {
        return storedMode;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

interface ThemeContextType {
    mode: PaletteMode;
    toggleColorMode: () => void;
    theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeModeProvider = ({children}: { children: React.ReactNode }) => {
    const [mode, setMode] = useState<PaletteMode>(() => resolveBrowserMode());
    const [browserModeResolved, setBrowserModeResolved] = useState(() => typeof window !== "undefined");

    const toggleColorMode = useCallback(() => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
    }, []);

    const theme = useMemo(() => createAppTheme(getDesignTokens(mode)), [mode]);
    const contextValue = useMemo<ThemeContextType>(() => ({mode, toggleColorMode, theme}), [mode, theme, toggleColorMode]);

    useEffect(() => {
        setMode(resolveBrowserMode());
        setBrowserModeResolved(true);
    }, []);

    useEffect(() => {
        if (!browserModeResolved) {
            return;
        }

        localStorage.setItem(THEME_STORAGE_KEY, mode);
    }, [browserModeResolved, mode]);

    useEffect(() => {
        const syncThemeMode = (event: StorageEvent) => {
            if (event.key !== THEME_STORAGE_KEY || !isPaletteMode(event.newValue)) {
                return;
            }

            setMode(event.newValue);
        };

        window.addEventListener("storage", syncThemeMode);

        return () => {
            window.removeEventListener("storage", syncThemeMode);
        };
    }, []);

    useEffect(() => {
        document.body.style.backgroundColor = theme.palette.background.default;
        document.body.style.color = theme.palette.text.primary;
        document.documentElement.dataset.fgcThemeMode = mode;
        document.documentElement.style.backgroundColor = theme.palette.background.default;
        document.documentElement.style.color = theme.palette.text.primary;
    }, [mode, theme]);

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
