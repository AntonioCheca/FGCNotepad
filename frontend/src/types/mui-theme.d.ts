import "@mui/material/styles";

type FgcTokenGroup = {
    app: {
        canvas: string;
        sidebar: string;
    };
    background: {
        default: string;
        paper: string;
        sidebar: string;
        workspace: string;
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
    control: {
        default: string;
        hover: string;
        active: string;
    };
    border: {
        subtle: string;
        default: string;
        strong: string;
    };
    text: {
        primary: string;
        secondary: string;
        disabled: string;
        muted: string;
    };
    action: {
        primary: string;
        primaryHover: string;
        primaryActive: string;
        secondary: string;
        secondaryHover: string;
        secondaryActive: string;
        utility: string;
        utilityHover: string;
        danger: string;
        dangerHover: string;
        disabled: string;
    };
    feedback: {
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
    accent: {
        parser: string;
        primary: string;
        selected: string;
        warning: string;
        success: string;
        danger: string;
    };
    section: {
        inputAccent: string;
        reviewAccent: string;
        finalizeAccent: string;
        inputHeader: string;
        reviewHeader: string;
        finalizeHeader: string;
    };
    chip: {
        neutralBg: string;
        neutralBorder: string;
        neutralText: string;
        warningBg: string;
        warningText: string;
        successBg: string;
        successText: string;
        infoBg: string;
        infoText: string;
    };
    parser: {
        nodeBg: string;
        nodeBorder: string;
        nodeSelectedBg: string;
        nodeSelectedBorder: string;
        nodeWarningBg: string;
        connector: string;
        editorBg: string;
    };
    typographyRole: {
        pageTitle: string;
        sectionTitle: string;
        label: string;
        body: string;
        helper: string;
        metadata: string;
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
