import {PaletteMode, createTheme} from "@mui/material";
import {purple} from "@mui/material/colors";

export const getDesignTokens = (mode: PaletteMode) =>
    createTheme({
        palette: {
            mode,
            ...(mode === "light"
                ? {
                    background: {default: "#fafafa", paper: "#fff"},
                    primary: {main: purple[700]},
                    text: {primary: "#000"},
                }
                : {
                    background: {default: "#003049", paper: "#003049"}, // dark blue tones
                    primary: {main: purple[200]},
                    text: {primary: "#FFFFFF"},
                })
        },
        typography: {
            fontFamily: `"Roboto", "Helvetica", "Arial", sans-serif`,
        },
    });
