import React from "react";
import {
    ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";

type AppThemeProviderProps = React.ComponentProps<typeof MUIThemeProvider>;

export const AppThemeProvider: React.FC<AppThemeProviderProps> = (props) => {
    return <MUIThemeProvider {...props} />;
};
