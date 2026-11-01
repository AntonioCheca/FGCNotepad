import {MatrixAxisItem, MatrixEditorState, createBodyCellKey} from "@/src/features/matrix/model";

export type MatrixHeatmapTone = "positiveStrong" | "positiveSoft" | "negativeStrong" | "negativeSoft" | "neutral";

export interface MatrixMixDatum {
    id: string;
    label: string;
    frequency: number;
    // Observed share from an imported scenario; null when the option was never measured.
    seen: number | null;
    seenSampleCount: number | null;
    // Rank in the mix: both mixes use colors in the same order, and an option keeps its color in both bars.
    colorIndex: number;
}

export interface WeightedOutcomeDatum {
    label: string;
    probability: number;
}

export interface MatrixInsights {
    attackerMix: MatrixMixDatum[];
    defenderMix: MatrixMixDatum[];
    expectedValue: number | null;
    expectedValueHpPercent: number | null;
    payoffMin: number | null;
    payoffMax: number | null;
    weightedOutcomes: WeightedOutcomeDatum[];
    heatmapToneByCellKey: Record<string, MatrixHeatmapTone>;
}

function safeNumber(value: number | null | undefined): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalize01(value: number): number {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
}

function resolveCellValue(state: MatrixEditorState, displayedBodyValues: Record<string, number | null>, rowId: string, columnId: string): number | null {
    const key = createBodyCellKey(rowId, columnId);
    const displayed = displayedBodyValues[key];
    if (typeof displayed === "number" && Number.isFinite(displayed)) {
        return displayed;
    }

    return safeNumber(state.grid.bodyCells[key]?.value);
}

function classifyOutcome(value: number): string {
    if (value <= -600) return "Punished Hard";
    if (value < -100) return "Punished";
    if (value <= 100) return "Scramble / Reset";
    if (value < 600) return "Advantage";
    return "Combo Achieved";
}

// Ordered by the Nash share, then the seen share, so both bars read in the same order.
function buildMix(axis: MatrixAxisItem[], optimalFrequency: (item: MatrixAxisItem) => number | null | undefined): MatrixMixDatum[] {
    return axis
        .map((item) => ({
            id: item.id,
            label: item.label || item.id,
            frequency: normalize01(optimalFrequency(item) ?? 0),
            seen: item.seenStats ? normalize01(item.seenStats.frequency) : null,
            seenSampleCount: item.seenStats?.sampleCount ?? null,
        }))
        .sort((a, b) => b.frequency - a.frequency || (b.seen ?? 0) - (a.seen ?? 0))
        .map((option, rank) => ({...option, colorIndex: rank}));
}

export function buildMatrixInsights(state: MatrixEditorState, displayedBodyValues: Record<string, number | null>, expectedValue: number | null): MatrixInsights {
    const attackerMix = buildMix(state.grid.rows, (row) => state.grid.rowSummaryCells[`row-summary::${row.id}`]?.value);
    const defenderMix = buildMix(state.grid.columns, (column) => state.grid.columnSummaryCells[`column-summary::${column.id}`]?.value);

    const payoffByCell = state.grid.rows.flatMap((row) =>
        state.grid.columns.map((column) => {
            const key = createBodyCellKey(row.id, column.id);
            const value = resolveCellValue(state, displayedBodyValues, row.id, column.id);
            const rowFrequency = normalize01(state.grid.rowSummaryCells[`row-summary::${row.id}`]?.value ?? 0);
            const columnFrequency = normalize01(state.grid.columnSummaryCells[`column-summary::${column.id}`]?.value ?? 0);
            return {
                key,
                value,
                probability: rowFrequency * columnFrequency,
            };
        })
    );

    const numericPayoffs: number[] = [];
    for (const entry of payoffByCell) {
        if (typeof entry.value === "number") {
            numericPayoffs.push(entry.value);
        }
    }
    const payoffMin = numericPayoffs.length > 0 ? Math.min(...numericPayoffs) : null;
    const payoffMax = numericPayoffs.length > 0 ? Math.max(...numericPayoffs) : null;
    const denom = payoffMin !== null && payoffMax !== null ? Math.max(Math.abs(payoffMin), Math.abs(payoffMax), 1) : 1;

    const weightedOutcomeMap = payoffByCell.reduce<Record<string, number>>((acc, entry) => {
        if (entry.value === null || entry.probability <= 0) {
            return acc;
        }
        const bucket = classifyOutcome(entry.value);
        acc[bucket] = (acc[bucket] ?? 0) + entry.probability;
        return acc;
    }, {});

    const weightedOutcomes: WeightedOutcomeDatum[] = [];
    for (const [label, probability] of Object.entries(weightedOutcomeMap)) {
        const percentage = Number((probability * 100).toFixed(2));
        if (percentage > 0) {
            weightedOutcomes.push({label, probability: percentage});
        }
    }
    weightedOutcomes.sort((a, b) => b.probability - a.probability);

    const heatmapToneByCellKey = payoffByCell.reduce<Record<string, MatrixHeatmapTone>>((acc, entry) => {
        if (entry.value === null) {
            acc[entry.key] = "neutral";
            return acc;
        }

        const normalized = entry.value / denom;
        if (normalized >= 0.65) acc[entry.key] = "positiveStrong";
        else if (normalized > 0.1) acc[entry.key] = "positiveSoft";
        else if (normalized <= -0.65) acc[entry.key] = "negativeStrong";
        else if (normalized < -0.1) acc[entry.key] = "negativeSoft";
        else acc[entry.key] = "neutral";
        return acc;
    }, {});

    const safeExpectedValue = safeNumber(expectedValue);
    const expectedValueHpPercent = safeExpectedValue === null ? null : Number(((safeExpectedValue / 10000) * 100).toFixed(2));

    return {
        attackerMix,
        defenderMix,
        expectedValue: safeExpectedValue,
        expectedValueHpPercent,
        payoffMin,
        payoffMax,
        weightedOutcomes,
        heatmapToneByCellKey,
    };
}
