import {createTheme, getContrastRatio} from "@mui/material/styles";

export type {PaletteMode, Theme, ThemeOptions} from "@mui/material/styles";

export const createAppTheme = createTheme;

// Picks whichever of the two text colours reads better on the given fill.
export function readableTextOn(fill: string, light: string, dark: string): string {
    return getContrastRatio(fill, light) >= getContrastRatio(fill, dark) ? light : dark;
}
