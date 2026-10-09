const GAUGE_PRECISION = 1000;

function roundGaugeValue(value: number): number {
    return Math.round(Math.max(0, value) * GAUGE_PRECISION) / GAUGE_PRECISION;
}

// One entry per Drive bar touched by the value: fill 1 for a full bar, the remainder for the last partial one.
export function driveGaugeSegments(value: number): Array<{bar: number; fill: number}> {
    const rounded = roundGaugeValue(value);
    const fullBars = Math.floor(rounded);
    const remainder = roundGaugeValue(rounded - fullBars);
    const fills = Array.from({length: fullBars}, () => 1);

    return (remainder > 0 ? [...fills, remainder] : fills).map((fill, position) => ({bar: position + 1, fill}));
}

export function superGaugeParts(value: number): {completedBars: number; fraction: number} {
    const rounded = roundGaugeValue(value);
    const completedBars = Math.floor(rounded);

    return {completedBars, fraction: roundGaugeValue(rounded - completedBars)};
}

export function parseGaugeValue(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === "" || value === "-") {
        return null;
    }

    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
