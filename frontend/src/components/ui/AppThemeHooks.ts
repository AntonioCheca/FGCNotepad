import {useMediaQuery, useTheme} from "@mui/material";
import type {Theme} from "@mui/material/styles";

export function useAppTheme(): Theme {
    return useTheme();
}

// True below the given breakpoint (phones for "md"); false during SSR so desktop markup is the default.
export function useIsBelowBreakpoint(breakpoint: "sm" | "md" | "lg"): boolean {
    const theme = useTheme();

    return useMediaQuery(theme.breakpoints.down(breakpoint));
}
