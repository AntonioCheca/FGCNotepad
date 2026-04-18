import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import {
    ThemeProvider as MUIThemeProvider,
    createTheme,
} from "@mui/material/styles";

export type {PaletteMode, Theme, ThemeOptions} from "@mui/material/styles";

type AppThemeProviderProps = React.ComponentProps<typeof MUIThemeProvider>;

export const AppThemeProvider: React.FC<AppThemeProviderProps> = (props) => {
    return <MUIThemeProvider {...props} />;
};

export const AppCssBaseline = CssBaseline;
export const createAppTheme = createTheme;
