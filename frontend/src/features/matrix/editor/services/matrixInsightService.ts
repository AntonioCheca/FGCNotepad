import {MatrixEditorState, createBodyCellKey} from "@/src/features/matrix/model";

export type MatrixHeatmapTone = "positiveStrong" | "positiveSoft" | "negativeStrong" | "negativeSoft" | "neutral";

export interface MatrixMixDatum {
    id: string;
    label: string;
    frequency: number;
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
    evHistogram: Array<{eventLabel: string; payoff: number; likelihood: number}>;
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

function classifyEventLabel(value: number): string {
    if (value <= -1000) return "OD DP Hit";
    if (value < 0) return "Punished";
    if (value === 0) return "Neutral / Whiff";
    if (value < 3000) return "Throw Landed";
    return "Max Punish Combo";
}

export function buildMatrixInsights(state: MatrixEditorState, displayedBodyValues: Record<string, number | null>, expectedValue: number | null): MatrixInsights {
    const attackerMix: MatrixMixDatum[] = state.grid.rows
        .map((row) => ({
            id: row.id,
            label: row.label || row.id,
            frequency: normalize01(state.grid.rowSummaryCells[`row-summary::${row.id}`]?.value ?? 0),
        }))
        .sort((a, b) => b.frequency - a.frequency);

    const defenderMix: MatrixMixDatum[] = state.grid.columns
        .map((column) => ({
            id: column.id,
            label: column.label || column.id,
            frequency: normalize01(state.grid.columnSummaryCells[`column-summary::${column.id}`]?.value ?? 0),
        }))
        .sort((a, b) => b.frequency - a.frequency);

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

    const evDistributionMap = payoffByCell.reduce<Record<number, number>>((acc, entry) => {
        if (entry.value === null || entry.probability <= 0) {
            return acc;
        }
        const roundedValue = Math.round(entry.value);
        acc[roundedValue] = (acc[roundedValue] ?? 0) + entry.probability;
        return acc;
    }, {});

    const evHistogram = Object.entries(evDistributionMap)
        .map(([value, likelihood]) => ({
            payoff: Number(value),
            likelihood: Number((likelihood * 100).toFixed(4)),
            eventLabel: `${classifyEventLabel(Number(value))} (${Number(value)})`,
        }))
        .sort((a, b) => a.payoff - b.payoff);

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
        evHistogram,
        heatmapToneByCellKey,
    };
}
