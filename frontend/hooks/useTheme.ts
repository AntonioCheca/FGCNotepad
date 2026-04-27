import {create} from "zustand";
import {persist} from "zustand/middleware";
import type {PaletteMode} from "@/src/components/ui/AppTheme";

interface ThemeStore {
    mode: PaletteMode;
    toggleMode: () => void;
    setMode: (mode: PaletteMode) => void;
}

const useThemeMode = create<ThemeStore>()(
    persist(
        (set, get) => ({
            mode: "light",
            toggleMode: () =>
                set({mode: get().mode === "light" ? "dark" : "light"}),
            setMode: (mode) => set({mode}),
        }),
        {
            name: "theme-mode", // localStorage key
        }
    )
);

export default useThemeMode;
