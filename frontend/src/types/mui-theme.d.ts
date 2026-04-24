import "@mui/material/styles";

type FgcTokenGroup = {
    background: {
        default: string;
        sidebar: string;
        workspace: string;
        surface: string;
        subtle: string;
    };
    surface: {
        base: string;
        raised: string;
        subtle: string;
        sunken: string;
        interactive: string;
        selected: string;
    };
    border: {
        subtle: string;
        default: string;
        strong: string;
    };
    text: {
        primary: string;
        secondary: string;
        muted: string;
    };
    action: {
        primary: string;
        primaryHover: string;
        secondary: string;
        secondaryHover: string;
        ghost: string;
        danger: string;
        disabled: string;
    };
    status: {
        error: string;
        warning: string;
        success: string;
        info: string;
    };
    highlight: {
        surface: string;
    };
    selection: {
        active: string;
        hover: string;
    };
    focus: {
        ring: string;
        outline: string;
    };
    icon: {
        primary: string;
        muted: string;
    };
};

declare module "@mui/material/styles" {
    interface Theme {
        fgc: FgcTokenGroup;
    }

    interface ThemeOptions {
        fgc?: FgcTokenGroup;
    }
}

export {};
