import "katex/dist/katex.min.css";
import {AppBox} from "@/src/components/ui/AppBox";
import type {Theme} from "@/src/components/ui/AppThemeUtils";

interface ResearchArticleBodyProps {
    html: string;
}

// The HTML is rendered at build time from Markdown files committed to this repository; raw HTML in them is dropped.
export function ResearchArticleBody({html}: ResearchArticleBodyProps) {
    return <AppBox sx={articleProseStyles} dangerouslySetInnerHTML={{__html: html}}/>;
}

const articleProseStyles = (theme: Theme) => ({
    minWidth: 0,
    color: theme.fgc.text.primary,
    fontSize: {xs: "1rem", md: "1.0625rem"},
    lineHeight: 1.75,
    overflowWrap: "break-word",
    "& > :first-child": {mt: 0},
    // Phones keep left alignment: justified lines that narrow open wide gaps between words.
    "& p": {[theme.breakpoints.up("sm")]: {textAlign: "justify", hyphens: "auto"}},
    "& p, & ul, & ol, & blockquote, & pre, & figure, & .research-table-scroll, & .katex-display": {my: 2},
    "& h2, & h3, & h4": {
        clear: "both",
        color: theme.fgc.text.primary,
        fontWeight: 700,
        lineHeight: 1.25,
        scrollMarginTop: theme.spacing(10),
    },
    "& h2": {fontSize: {xs: "1.375rem", md: "1.5rem"}, mt: 5, mb: 1.5, pb: 0.75, borderBottom: `1px solid ${theme.fgc.border.default}`},
    "& h3": {fontSize: {xs: "1.15rem", md: "1.2rem"}, mt: 3.5, mb: 1},
    "& h4": {fontSize: "1rem", mt: 3, mb: 1},
    "& ul, & ol": {pl: 3},
    "& li + li": {mt: 0.5},
    "& a": {
        color: theme.fgc.action.primaryText,
        fontWeight: 600,
        textDecoration: "underline",
        textUnderlineOffset: "0.15em",
        "&:hover": {color: theme.fgc.text.primary},
    },
    "& a:focus-visible, & .research-table-scroll:focus-visible, & pre:focus-visible, & .katex-display:focus-visible": {
        outline: `2px solid ${theme.fgc.focus.outline}`,
        outlineOffset: 2,
        borderRadius: 1,
    },
    "& strong": {fontWeight: 700},
    "& hr": {clear: "both", my: 4, border: 0, borderTop: `1px solid ${theme.fgc.border.default}`},
    "& blockquote": {
        // Keeps the note's background from running under a floated figure.
        display: "flow-root",
        mx: 0,
        px: 2,
        py: 1.25,
        borderLeft: `3px solid ${theme.fgc.border.strong}`,
        backgroundColor: theme.fgc.surface.sunken,
        color: theme.fgc.text.secondary,
        borderRadius: 1,
        "& > :first-of-type": {mt: 0},
        "& > :last-child": {mb: 0},
    },
    "& code": {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: "0.875em",
        px: 0.5,
        py: 0.125,
        borderRadius: 0.75,
        backgroundColor: theme.fgc.surface.sunken,
    },
    "& pre": {
        p: 1.5,
        overflowX: "auto",
        borderRadius: 1.5,
        border: `1px solid ${theme.fgc.border.default}`,
        backgroundColor: theme.fgc.surface.sunken,
        lineHeight: 1.55,
        "& code": {p: 0, backgroundColor: "transparent", fontSize: "0.85rem"},
    },
    "& figure": {
        mx: 0,
        my: 3,
        display: "grid",
        gap: 1,
        justifyItems: "center",
    },
    "& figure.research-figure-right": {
        [theme.breakpoints.up("sm")]: {
            float: "right",
            clear: "right",
            width: "var(--research-figure-width)",
            mt: 0.75,
            mb: 2,
            ml: 3,
        },
    },
    "& img": {
        display: "block",
        maxWidth: "100%",
        height: "auto",
        borderRadius: 1,
    },
    "& figcaption": {
        width: "100%",
        fontSize: "0.875rem",
        lineHeight: 1.55,
        fontStyle: "italic",
        textAlign: "center",
        color: theme.fgc.text.secondary,
    },
    "& .research-table-scroll": {
        overflowX: "auto",
        border: `1px solid ${theme.fgc.border.default}`,
        borderRadius: 1.5,
    },
    "& table": {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "0.9rem",
        lineHeight: 1.45,
        fontVariantNumeric: "tabular-nums",
    },
    "& th, & td": {
        px: 1.25,
        py: 0.75,
        textAlign: "left",
        whiteSpace: "nowrap",
        borderBottom: `1px solid ${theme.fgc.border.subtle}`,
    },
    "& th": {fontWeight: 700, backgroundColor: theme.fgc.surface.subtle},
    "& tbody tr:last-of-type td": {borderBottom: 0},
    "& .katex-display": {overflowX: "auto", overflowY: "hidden", py: 0.5},
    "& .footnotes": {
        clear: "both",
        mt: 5,
        pt: 1,
        borderTop: `1px solid ${theme.fgc.border.default}`,
        fontSize: "0.875rem",
        color: theme.fgc.text.secondary,
    },
    "& .sr-only": {
        position: "absolute",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
        whiteSpace: "nowrap",
    },
});
