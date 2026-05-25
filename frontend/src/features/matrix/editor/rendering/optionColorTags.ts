import {MatrixOptionColorTag} from "@/src/features/matrix/model";

type ThemeWithFgc = {
    fgc: {
        icon: {
            primary: string;
        };
        accent: {
            primary: string;
            selected: string;
            warning: string;
            success: string;
            parser: string;
        };
        border: {
            strong: string;
        };
        feedback: {
            error: string;
            info: string;
        };
    };
};

export function resolveOptionTagColor(theme: ThemeWithFgc, tag: MatrixOptionColorTag | null | undefined): string {
    if (tag === "tag1") return theme.fgc.accent.primary;
    if (tag === "tag2") return theme.fgc.accent.selected;
    if (tag === "tag3") return theme.fgc.accent.warning;
    if (tag === "tag4") return theme.fgc.accent.success;
    if (tag === "tag5") return theme.fgc.accent.parser;
    return theme.fgc.border.strong;
}

export function buildChartPalette(theme: ThemeWithFgc, count: number): string[] {
    const base = [
        theme.fgc.accent.primary,
        theme.fgc.accent.selected,
        theme.fgc.accent.parser,
        theme.fgc.accent.success,
        theme.fgc.feedback.error,
        theme.fgc.feedback.info,
    ];

    if (count <= base.length) {
        return base.slice(0, count);
    }

    return Array.from({length: count}, (_, index) => base[index % base.length]);
}
