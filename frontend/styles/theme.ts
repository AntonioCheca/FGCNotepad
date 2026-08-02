export type PaletteMode = "light" | "dark";

type FgcTokenSet = {
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
        errorBg: string;
        errorText: string;
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

type Theme = {
    fgc: FgcTokenSet;
    palette: {
        secondary: {
            contrastText: string;
        };
    };
};

const lightTokens: FgcTokenSet = {
    app: {
        canvas: "#f8fafc",
        sidebar: "#edf3f8",
    },
    background: {
        default: "#f8fafc",
        paper: "#ffffff",
        sidebar: "#edf3f8",
        workspace: "#f3f7fb",
        subtle: "#f1f5f9",
    },
    surface: {
        base: "#ffffff",
        raised: "#ffffff",
        subtle: "#f1f5f9",
        sunken: "#e8eef5",
        interactive: "#e9f2f8",
        selected: "#fff1cf",
    },
    control: {
        default: "#e9f2f8",
        hover: "#dfeaf4",
        active: "#d2e2ef",
    },
    border: {
        subtle: "#e6edf4",
        default: "#dbe3ea",
        strong: "#b9c7d5",
    },
    text: {
        primary: "#0f172a",
        secondary: "#475569",
        disabled: "#7f8ea3",
        muted: "#64748b",
    },
    action: {
        primary: "#d72829",
        primaryHover: "#b91c1c",
        primaryActive: "#991b1b",
        secondary: "#246f89",
        secondaryHover: "#1f5f74",
        secondaryActive: "#194a5d",
        utility: "#f78002",
        utilityHover: "#da6b00",
        danger: "#b91c1c",
        dangerHover: "#991b1b",
        disabled: "#94a3b8",
    },
    feedback: {
        error: "#d72829",
        warning: "#f78002",
        success: "#2f855a",
        info: "#246f89",
    },
    highlight: {
        surface: "#fff7db",
    },
    selection: {
        active: "#fcbf49",
        hover: "#e9f1f8",
    },
    focus: {
        ring: "#003049",
        outline: "#003049",
    },
    icon: {
        primary: "#003049",
        muted: "#64748b",
    },
    accent: {
        parser: "#f78002",
        primary: "#d72829",
        selected: "#246f89",
        warning: "#fcbf49",
        success: "#2f855a",
        danger: "#b91c1c",
    },
    section: {
        inputAccent: "#f78002",
        reviewAccent: "#246f89",
        finalizeAccent: "#d72829",
        inputHeader: "#f5f9fc",
        reviewHeader: "#f5f9fc",
        finalizeHeader: "#f5f9fc",
    },
    chip: {
        neutralBg: "#eef4fa",
        neutralBorder: "#d6e2ee",
        neutralText: "#264157",
        warningBg: "#fff2d6",
        warningText: "#8c4f00",
        errorBg: "#fde8e8",
        errorText: "#9f1d1d",
        successBg: "#e6f7ee",
        successText: "#1e5b3d",
        infoBg: "#e8f6fb",
        infoText: "#1b5669",
    },
    parser: {
        nodeBg: "#f2f7fb",
        nodeBorder: "#c8d9e9",
        nodeSelectedBg: "#fff8e3",
        nodeSelectedBorder: "#fcbf49",
        nodeWarningBg: "#fff1e0",
        connector: "#9eb6ca",
        editorBg: "#edf4fa",
    },
    typographyRole: {
        pageTitle: "#0f172a",
        sectionTitle: "#1e293b",
        label: "#334155",
        body: "#0f172a",
        helper: "#5f728a",
        metadata: "#556a81",
    },
};

const darkTokens: FgcTokenSet = {
    app: {
        canvas: "#04141f",
        sidebar: "#062236",
    },
    background: {
        default: "#04141f",
        paper: "#0b2333",
        sidebar: "#062236",
        workspace: "#081a28",
        subtle: "#0f2c3f",
    },
    surface: {
        base: "#0b2333",
        raised: "#123347",
        subtle: "#102d40",
        sunken: "#081e2d",
        interactive: "#103244",
        selected: "#18455d",
    },
    control: {
        default: "#103244",
        hover: "#144158",
        active: "#19506c",
    },
    border: {
        subtle: "#1a445a",
        default: "#275f78",
        strong: "#4d9eba",
    },
    text: {
        primary: "#e4f2f8",
        secondary: "#bdd6e1",
        disabled: "#7294a4",
        muted: "#98bac8",
    },
    action: {
        primary: "#d72829",
        primaryHover: "#b91c1c",
        primaryActive: "#8f1a1a",
        secondary: "#4d9eba",
        secondaryHover: "#68afc8",
        secondaryActive: "#357f99",
        utility: "#fcbf49",
        utilityHover: "#e5a835",
        danger: "#d72829",
        dangerHover: "#b91c1c",
        disabled: "#2a4b5b",
    },
    feedback: {
        error: "#d72829",
        warning: "#fcbf49",
        success: "#a2ccdb",
        info: "#4d9eba",
    },
    highlight: {
        surface: "#144d66",
    },
    selection: {
        active: "#246f89",
        hover: "#1a5974",
    },
    focus: {
        ring: "#a2ccdb",
        outline: "#a2ccdb",
    },
    icon: {
        primary: "#dff1f7",
        muted: "#9ec0cb",
    },
    accent: {
        parser: "#f78002",
        primary: "#d72829",
        selected: "#4d9eba",
        warning: "#fcbf49",
        success: "#7ccfa6",
        danger: "#d72829",
    },
    section: {
        inputAccent: "#f78002",
        reviewAccent: "#4d9eba",
        finalizeAccent: "#d72829",
        inputHeader: "#0b2333",
        reviewHeader: "#0b2333",
        finalizeHeader: "#0b2333",
    },
    chip: {
        neutralBg: "#1a3d53",
        neutralBorder: "#2f6079",
        neutralText: "#d4e8f1",
        warningBg: "#43351f",
        warningText: "#ffd27b",
        errorBg: "#4d2024",
        errorText: "#ffb4b4",
        successBg: "#1f3f46",
        successText: "#c5e0ea",
        infoBg: "#1a4558",
        infoText: "#9fd0e1",
    },
    parser: {
        nodeBg: "#123347",
        nodeBorder: "#275f78",
        nodeSelectedBg: "#18455d",
        nodeSelectedBorder: "#4d9eba",
        nodeWarningBg: "#081e2d",
        connector: "#4d9eba",
        editorBg: "#081e2d",
    },
    typographyRole: {
        pageTitle: "#f0f8fb",
        sectionTitle: "#d9ecf4",
        label: "#b9d4df",
        body: "#d3e7ef",
        helper: "#9fbfcb",
        metadata: "#86a9b7",
    },
};

export const getDesignTokens = (mode: PaletteMode) => {
    const tokens = mode === "light" ? lightTokens : darkTokens;

    return {
        palette: {
            mode,
            ...(mode === "light"
                ? {
                    primary: {
                        main: tokens.action.primary,
                        light: "#e25354",
                        dark: "#9f1a1d",
                        contrastText: "#ffffff",
                    },
                    secondary: {
                        main: tokens.action.secondary,
                        light: "#4d91a7",
                        dark: "#184f62",
                        contrastText: "#f5fbfd",
                    },
                    error: {
                        main: tokens.feedback.error,
                        light: "#e25354",
                        dark: "#7d1215",
                        contrastText: "#ffffff",
                    },
                    warning: {
                        main: tokens.feedback.warning,
                        light: "#fb9e38",
                        dark: "#8c4f00",
                        contrastText: "#3a2100",
                    },
                    success: {
                        main: tokens.feedback.success,
                        light: "#40a373",
                        dark: "#1e5b3d",
                        contrastText: "#f6fffa",
                    },
                    info: {
                        main: tokens.feedback.info,
                        light: "#4d91a7",
                        dark: "#1b5669",
                        contrastText: "#f6fbfd",
                    },
                    background: {
                        default: tokens.background.default,
                        paper: tokens.background.paper,
                    },
                    text: {
                        primary: tokens.text.primary,
                        secondary: tokens.text.secondary,
                        disabled: tokens.text.disabled,
                    },
                    divider: tokens.border.default,
                    action: {
                        active: tokens.icon.primary,
                        hover: tokens.background.subtle,
                        selected: tokens.highlight.surface,
                        disabled: tokens.action.disabled,
                        disabledBackground: "#e5ebf2",
                        focus: tokens.focus.ring,
                    },
                }
                : {
                    primary: {
                        main: tokens.action.primary,
                        light: "#e25354",
                        dark: "#8f191a",
                        contrastText: "#ffffff",
                    },
                    secondary: {
                        main: tokens.action.secondary,
                        light: "#68afc8",
                        dark: "#2f7c96",
                        contrastText: "#f0f7fa",
                    },
                    error: {
                        main: tokens.feedback.error,
                        light: "#e25354",
                        dark: "#8f191a",
                        contrastText: "#ffffff",
                    },
                    warning: {
                        main: tokens.feedback.warning,
                        light: "#ffd27b",
                        dark: "#b27d1d",
                        contrastText: "#2a1b00",
                    },
                    success: {
                        main: tokens.feedback.success,
                        light: "#c5e0ea",
                        dark: "#6f97a6",
                        contrastText: "#00283c",
                    },
                    info: {
                        main: tokens.feedback.info,
                        light: "#8dc1d2",
                        dark: "#3d8ca8",
                        contrastText: "#f5fbfd",
                    },
                    background: {
                        default: tokens.background.default,
                        paper: tokens.background.paper,
                    },
                    text: {
                        primary: tokens.text.primary,
                        secondary: tokens.text.secondary,
                        disabled: tokens.text.disabled,
                    },
                    divider: tokens.border.default,
                    action: {
                        active: tokens.icon.primary,
                        hover: tokens.selection.hover,
                        selected: tokens.selection.active,
                        disabled: tokens.action.disabled,
                        disabledBackground: "#0d2937",
                        focus: tokens.focus.ring,
                    },
                }),
            contrastThreshold: 4.5,
        },
        shape: {
            borderRadius: 10,
        },
        typography: {
            fontFamily: `"IBM Plex Sans", "Source Sans 3", "Segoe UI", sans-serif`,
            h3: {
                fontWeight: 730,
                letterSpacing: "0.01em",
                color: tokens.typographyRole.pageTitle,
                lineHeight: 1.14,
            },
            h4: {
                fontWeight: 700,
                letterSpacing: "0.01em",
                color: tokens.typographyRole.sectionTitle,
                lineHeight: 1.18,
            },
            h5: {
                fontWeight: 650,
                color: tokens.typographyRole.sectionTitle,
                lineHeight: 1.22,
            },
            subtitle1: {
                fontWeight: 620,
                color: tokens.typographyRole.sectionTitle,
                lineHeight: 1.3,
            },
            subtitle2: {
                fontWeight: 600,
                color: tokens.typographyRole.label,
                lineHeight: 1.32,
            },
            body1: {
                color: tokens.typographyRole.body,
                lineHeight: 1.55,
            },
            body2: {
                color: tokens.typographyRole.body,
                lineHeight: 1.5,
            },
            caption: {
                color: tokens.typographyRole.helper,
                lineHeight: 1.38,
            },
            overline: {
                color: tokens.typographyRole.metadata,
                letterSpacing: "0.09em",
            },
            button: {
                textTransform: "none" as const,
                fontWeight: 650,
                letterSpacing: "0.02em",
            },
        },
        fgc: tokens,
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: tokens.app.canvas,
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: ({theme}: {theme: Theme}) => ({
                        backgroundColor: theme.fgc.surface.base,
                        borderColor: theme.fgc.border.default,
                    }),
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: ({theme}: {theme: Theme}) => ({
                        borderRadius: 8,
                        boxShadow: "none",
                        transition: "background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.12s ease",
                        ":focus-visible": {
                            outline: `2px solid ${theme.fgc.focus.outline}`,
                            outlineOffset: 1,
                        },
                        "&:active": {
                            transform: "translateY(0.5px)",
                        },
                    }),
                    containedPrimary: ({theme}: {theme: Theme}) => ({
                        backgroundColor: theme.fgc.action.primary,
                        color: "#ffffff",
                        boxShadow: `0 0 0 1px ${theme.fgc.action.primary} inset`,
                        ":hover": {
                            backgroundColor: theme.fgc.action.primaryHover,
                            boxShadow: `0 8px 18px -12px ${theme.fgc.action.primaryHover}`,
                        },
                        "&:active": {
                            backgroundColor: theme.fgc.action.primaryActive,
                        },
                        "&.Mui-disabled": {
                            color: theme.fgc.text.disabled,
                            backgroundColor: theme.fgc.action.disabled,
                            boxShadow: "none",
                        },
                    }),
                    containedSecondary: ({theme}: {theme: Theme}) => ({
                        backgroundColor: theme.fgc.action.secondary,
                        color: theme.palette.secondary.contrastText,
                        boxShadow: `0 0 0 1px ${theme.fgc.border.strong} inset`,
                        ":hover": {
                            backgroundColor: theme.fgc.action.secondaryHover,
                        },
                        "&:active": {
                            backgroundColor: theme.fgc.action.secondaryActive,
                        },
                        "&.Mui-disabled": {
                            color: theme.fgc.text.disabled,
                            backgroundColor: theme.fgc.action.disabled,
                        },
                    }),
                    outlinedPrimary: ({theme}: {theme: Theme}) => ({
                        borderColor: theme.fgc.border.strong,
                        color: mode === "light" ? theme.fgc.text.primary : theme.fgc.icon.primary,
                        ":hover": {
                            borderColor: theme.fgc.action.secondary,
                            backgroundColor: theme.fgc.selection.hover,
                        },
                    }),
                    outlinedSecondary: ({theme}: {theme: Theme}) => ({
                        borderColor: theme.fgc.border.default,
                        color: theme.fgc.text.secondary,
                        backgroundColor: "transparent",
                        ":hover": {
                            borderColor: theme.fgc.border.strong,
                            backgroundColor: theme.fgc.control.default,
                            color: theme.fgc.text.primary,
                        },
                        "&.Mui-disabled": {
                            borderColor: theme.fgc.border.subtle,
                            color: theme.fgc.text.disabled,
                        },
                    }),
                    textSecondary: ({theme}: {theme: Theme}) => ({
                        color: theme.fgc.accent.parser,
                        ":hover": {
                            backgroundColor: theme.fgc.surface.subtle,
                            color: theme.fgc.action.utilityHover,
                        },
                        "&.Mui-disabled": {
                            color: theme.fgc.text.disabled,
                        },
                    }),
                    outlinedError: ({theme}: {theme: Theme}) => ({
                        borderColor: theme.fgc.feedback.error,
                        color: theme.fgc.feedback.error,
                        ":hover": {
                            borderColor: theme.fgc.action.dangerHover,
                            backgroundColor: theme.fgc.surface.sunken,
                        },
                    }),
                },
            },
            MuiTextField: {
                defaultProps: {
                    size: "small" as const,
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: ({theme}: {theme: Theme}) => ({
                        backgroundColor: theme.fgc.control.default,
                        boxShadow: `0 1px 0 0 ${theme.fgc.border.subtle} inset`,
                        transition: "background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                        ":hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: theme.fgc.border.strong,
                        },
                        ":hover": {
                            backgroundColor: theme.fgc.control.hover,
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: theme.fgc.focus.ring,
                            borderWidth: 2,
                        },
                        "&.Mui-focused": {
                            backgroundColor: theme.fgc.control.active,
                            boxShadow: `0 0 0 2px ${theme.fgc.selection.hover}`,
                        },
                        "&.Mui-error .MuiOutlinedInput-notchedOutline": {
                            borderColor: theme.fgc.feedback.error,
                        },
                        "&.Mui-disabled": {
                            backgroundColor: theme.fgc.surface.sunken,
                        },
                    }),
                    notchedOutline: ({theme}: {theme: Theme}) => ({
                        borderColor: theme.fgc.border.default,
                    }),
                },
            },
            MuiInputLabel: {
                styleOverrides: {
                    root: ({theme}: {theme: Theme}) => ({
                        color: theme.fgc.text.secondary,
                        "&.Mui-focused": {
                            color: theme.fgc.text.primary,
                        },
                        "&.Mui-error": {
                            color: theme.fgc.feedback.error,
                        },
                        "&.Mui-disabled": {
                            color: theme.fgc.text.disabled,
                        },
                    }),
                },
            },
            MuiFormHelperText: {
                styleOverrides: {
                    root: ({theme}: {theme: Theme}) => ({
                        color: theme.fgc.typographyRole.helper,
                        marginLeft: 2,
                        marginRight: 2,
                        "&.Mui-error": {
                            color: theme.fgc.feedback.error,
                        },
                    }),
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: ({theme}: {theme: Theme}) => ({
                        backgroundColor: theme.fgc.chip.neutralBg,
                        color: theme.fgc.chip.neutralText,
                        borderColor: theme.fgc.chip.neutralBorder,
                        fontWeight: 620,
                    }),
                    outlined: ({theme}: {theme: Theme}) => ({
                        borderColor: theme.fgc.chip.neutralBorder,
                    }),
                    colorWarning: ({theme}: {theme: Theme}) => ({
                        backgroundColor: theme.fgc.chip.warningBg,
                        color: theme.fgc.chip.warningText,
                        borderColor: theme.fgc.chip.warningText,
                    }),
                    colorError: ({theme}: {theme: Theme}) => ({
                        backgroundColor: theme.fgc.chip.errorBg,
                        color: theme.fgc.chip.errorText,
                        borderColor: theme.fgc.chip.errorText,
                    }),
                    colorSuccess: ({theme}: {theme: Theme}) => ({
                        backgroundColor: theme.fgc.chip.successBg,
                        color: theme.fgc.chip.successText,
                        borderColor: theme.fgc.chip.successText,
                    }),
                    colorInfo: ({theme}: {theme: Theme}) => ({
                        backgroundColor: theme.fgc.chip.infoBg,
                        color: theme.fgc.chip.infoText,
                        borderColor: theme.fgc.chip.infoText,
                    }),
                },
            },
            MuiAutocomplete: {
                styleOverrides: {
                    paper: ({theme}: {theme: Theme}) => ({
                        backgroundColor: theme.fgc.surface.raised,
                        border: `1px solid ${theme.fgc.border.default}`,
                    }),
                    option: ({theme}: {theme: Theme}) => ({
                        '&[aria-selected="true"]': {
                            backgroundColor: theme.fgc.selection.active,
                            color: theme.fgc.text.primary,
                        },
                    }),
                },
            },
        },
    };
};
