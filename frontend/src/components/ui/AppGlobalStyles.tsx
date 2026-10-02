import React from "react";
import {GlobalStyles as MUIGlobalStyles} from "@mui/material";
import type {Theme} from "@/src/components/ui/AppThemeUtils";

// Pages-router pages do not load app/globals.css, so the base document styles live here.
export function AppGlobalStyles() {
    return (
        <MUIGlobalStyles
            styles={(theme: Theme) => ({
                body: {
                    fontFamily: theme.typography.fontFamily,
                },
                [theme.breakpoints.down("md")]: {
                    body: {
                        margin: 0,
                    },
                    // Width 100% + padding must not overflow on phones (desktop keeps the browser default).
                    "*, *::before, *::after": {
                        boxSizing: "border-box",
                    },
                    // iOS Safari zooms into any focused field whose text is smaller than 16px.
                    "input, select, textarea": {
                        fontSize: "16px !important",
                    },
                    "button, a, [role=button]": {
                        touchAction: "manipulation",
                    },
                },
            })}
        />
    );
}
