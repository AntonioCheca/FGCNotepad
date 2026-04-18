export type PaletteMode = "light" | "dark";

export const getDesignTokens = (mode: PaletteMode) => ({
    palette: {
        mode,
        ...(mode === "light"
            ? {
                background: {default: "#fafafa", paper: "#fff"},
                primary: {main: "#7b1fa2"},
                text: {primary: "#000"},
            }
            : {
                background: {default: "#003049", paper: "#003049"},
                primary: {main: "#ce93d8"},
                text: {primary: "#FFFFFF"},
            }),
    },
    typography: {
        fontFamily: `"Roboto", "Helvetica", "Arial", sans-serif`,
    },
});
