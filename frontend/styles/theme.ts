export type PaletteMode = "light" | "dark";

type FgcTokenSet = {
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

const lightTokens: FgcTokenSet = {
    background: {
        default: "#f8fafc",
        sidebar: "#edf3f8",
        workspace: "#f3f7fb",
        surface: "#ffffff",
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
    border: {
        subtle: "#e6edf4",
        default: "#dbe3ea",
        strong: "#b9c7d5",
    },
    text: {
        primary: "#0f172a",
        secondary: "#475569",
        muted: "#64748b",
    },
    action: {
        primary: "#d72829",
        primaryHover: "#b91c1c",
        secondary: "#246f89",
        secondaryHover: "#1f5f74",
        ghost: "#f78002",
        danger: "#b91c1c",
        disabled: "#94a3b8",
    },
    status: {
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
};

const darkTokens: FgcTokenSet = {
    background: {
        default: "#061824",
        sidebar: "#082c3d",
        workspace: "#0d3a52",
        surface: "#0d3a52",
        subtle: "#124760",
    },
    surface: {
        base: "#0d3a52",
        raised: "#124760",
        subtle: "#103f58",
        sunken: "#0a3146",
        interactive: "#16536e",
        selected: "#1f6682",
    },
    border: {
        subtle: "#1f4f67",
        default: "#2a627c",
        strong: "#4d9eba",
    },
    text: {
        primary: "#e8f4fa",
        secondary: "#bdd6e1",
        muted: "#8fb2c2",
    },
    action: {
        primary: "#d72829",
        primaryHover: "#b91c1c",
        secondary: "#4d9eba",
        secondaryHover: "#68afc8",
        ghost: "#f78002",
        danger: "#d72829",
        disabled: "#2d5366",
    },
    status: {
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
                        main: tokens.status.error,
                        light: "#e25354",
                        dark: "#7d1215",
                        contrastText: "#ffffff",
                    },
                    warning: {
                        main: tokens.status.warning,
                        light: "#fb9e38",
                        dark: "#8c4f00",
                        contrastText: "#3a2100",
                    },
                    success: {
                        main: tokens.status.success,
                        light: "#40a373",
                        dark: "#1e5b3d",
                        contrastText: "#f6fffa",
                    },
                    info: {
                        main: tokens.status.info,
                        light: "#4d91a7",
                        dark: "#1b5669",
                        contrastText: "#f6fbfd",
                    },
                    background: {
                        default: tokens.background.default,
                        paper: tokens.background.surface,
                    },
                    text: {
                        primary: tokens.text.primary,
                        secondary: tokens.text.secondary,
                        disabled: tokens.text.muted,
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
                        main: tokens.status.error,
                        light: "#e25354",
                        dark: "#8f191a",
                        contrastText: "#ffffff",
                    },
                    warning: {
                        main: tokens.status.warning,
                        light: "#ffd27b",
                        dark: "#b27d1d",
                        contrastText: "#2a1b00",
                    },
                    success: {
                        main: tokens.status.success,
                        light: "#c5e0ea",
                        dark: "#6f97a6",
                        contrastText: "#00283c",
                    },
                    info: {
                        main: tokens.status.info,
                        light: "#8dc1d2",
                        dark: "#3d8ca8",
                        contrastText: "#f5fbfd",
                    },
                    background: {
                        default: tokens.background.default,
                        paper: tokens.background.surface,
                    },
                    text: {
                        primary: tokens.text.primary,
                        secondary: tokens.text.secondary,
                        disabled: tokens.text.muted,
                    },
                    divider: tokens.border.default,
                    action: {
                        active: tokens.icon.primary,
                        hover: tokens.selection.hover,
                        selected: tokens.selection.active,
                        disabled: tokens.action.disabled,
                        disabledBackground: "#11394d",
                        focus: tokens.focus.ring,
                    },
                }),
            contrastThreshold: 4.5,
        },
        shape: {
            borderRadius: 8,
        },
        typography: {
            fontFamily: `"IBM Plex Sans", "Source Sans 3", "Segoe UI", sans-serif`,
            h4: {
                fontWeight: 700,
                letterSpacing: "0.01em",
            },
            h5: {
                fontWeight: 650,
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
                        backgroundColor: tokens.background.default,
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: ({theme}) => ({
                        backgroundColor: theme.fgc.surface.base,
                        borderColor: theme.fgc.border.default,
                    }),
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: ({theme}) => ({
                        borderRadius: 8,
                        ':focus-visible': {
                            outline: `2px solid ${theme.fgc.focus.outline}`,
                            outlineOffset: 1,
                        },
                    }),
                    containedPrimary: ({theme}) => ({
                        backgroundColor: theme.fgc.action.primary,
                        color: "#ffffff",
                        ':hover': {
                            backgroundColor: theme.fgc.action.primaryHover,
                        },
                    }),
                    outlinedPrimary: ({theme}) => ({
                        borderColor: theme.fgc.border.strong,
                        color: mode === "light" ? theme.fgc.text.primary : theme.fgc.icon.primary,
                        ':hover': {
                            borderColor: theme.fgc.action.secondary,
                            backgroundColor: theme.fgc.selection.hover,
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
                    root: ({theme}) => ({
                        backgroundColor: theme.fgc.surface.interactive,
                        ':hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.fgc.border.strong,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.fgc.focus.ring,
                            borderWidth: 2,
                        },
                    }),
                    notchedOutline: ({theme}) => ({
                        borderColor: theme.fgc.border.default,
                    }),
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: ({theme}) => ({
                        backgroundColor: theme.fgc.highlight.surface,
                        borderColor: theme.fgc.border.strong,
                    }),
                },
            },
        },
    };
};
