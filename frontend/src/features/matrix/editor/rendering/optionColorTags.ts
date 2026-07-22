type ThemeWithFgc = {
    fgc: {
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
