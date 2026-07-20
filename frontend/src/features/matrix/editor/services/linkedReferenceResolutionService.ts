import {MatrixEditorState, MatrixLinkedCellResolution} from "@/src/features/matrix/model";
import {buildPayoffMatrix, toSolveRowsAndColumns} from "./matrixSolveService";

const MAX_REFERENCE_DEPTH = 3;

function formatFormulaValue(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getStaticPreValue(cell: MatrixEditorState["grid"]["bodyCells"][string]): number {
    if (cell?.kind !== "reference" || !cell.reference) {
        return 0;
    }

    if (cell.reference.preValue.kind === "static") {
        return cell.reference.preValue.staticValue;
    }

    return 0;
}

function getMaxLayer(state: MatrixEditorState): number {
    return Math.max(
        1,
        ...state.grid.rows.map((row) => row.layer),
        ...state.grid.columns.map((column) => column.layer)
    );
}

function toExpectedValue(result: unknown, payoffMatrix: Record<string, Record<string, number>>): number {
    const equilibrium = Array.isArray((result as {equilibria?: unknown[]})?.equilibria)
        ? (result as {equilibria?: unknown[]}).equilibria?.[0]
        : null;

    if (!equilibrium || typeof equilibrium !== "object") {
        return 0;
    }

    let expectedValue = 0;
    Object.entries(payoffMatrix).forEach(([rowKey, columns]) => {
        const rowProbability = (equilibrium as Record<string, Record<string, unknown>>).P1?.[rowKey];
        const rowNumeric = typeof rowProbability === "number" && Number.isFinite(rowProbability) ? rowProbability : 0;

        Object.entries(columns).forEach(([columnKey, value]) => {
            const columnProbability = (equilibrium as Record<string, Record<string, unknown>>).P2?.[columnKey];
            const columnNumeric = typeof columnProbability === "number" && Number.isFinite(columnProbability) ? columnProbability : 0;
            expectedValue += value * rowNumeric * columnNumeric;
        });
    });

    return expectedValue;
}

interface ResolveEditorLinkedReferencesOptions {
    state: MatrixEditorState;
    currentScenarioId: string | null;
    baseDisplayedBodyValues: Record<string, number | null>;
    existingResolutions: Record<string, MatrixLinkedCellResolution>;
    solveGame: (payoffMatrix: Record<string, Record<string, number>>) => Promise<unknown>;
}

export async function resolveEditorLinkedReferences({
    state,
    currentScenarioId,
    baseDisplayedBodyValues,
    existingResolutions,
    solveGame,
}: ResolveEditorLinkedReferencesOptions): Promise<Record<string, MatrixLinkedCellResolution>> {
    if (!currentScenarioId) {
        return existingResolutions;
    }

    const selfReferenceKeys: string[] = [];
    for (const cell of Object.values(state.grid.bodyCells)) {
        if (cell.kind === "reference" && cell.reference?.scenarioId === currentScenarioId) {
            selfReferenceKeys.push(cell.key);
        }
    }

    if (selfReferenceKeys.length === 0) {
        return existingResolutions;
    }

    async function resolveExpectedValue(depth: number): Promise<number> {
        const layerLimit = getMaxLayer(state);
        const {rows, columns} = toSolveRowsAndColumns(state, layerLimit);
        const displayedBodyValues = {...baseDisplayedBodyValues};

        for (const key of selfReferenceKeys) {
            const cell = state.grid.bodyCells[key];
            const basePreValue = getStaticPreValue(cell);
            const linkedExpectedValue = depth >= MAX_REFERENCE_DEPTH ? 0 : await resolveExpectedValue(depth + 1);
            displayedBodyValues[key] = basePreValue + linkedExpectedValue;
        }

        const payoffMatrix = buildPayoffMatrix({
            state,
            rows,
            columns,
            displayedBodyValues,
            dynamicOverrides: {},
        });

        const result = await solveGame(payoffMatrix);
        return toExpectedValue(result, payoffMatrix);
    }

    const nextResolutions = {...existingResolutions};
    for (const key of selfReferenceKeys) {
        const cell = state.grid.bodyCells[key];
        const basePreValue = getStaticPreValue(cell);
        const linkedExpectedValue = await resolveExpectedValue(2);
        const finalValue = basePreValue + linkedExpectedValue;
        nextResolutions[key] = {
            basePreValue,
            linkedExpectedValue,
            finalValue,
            displayFormula: `${formatFormulaValue(basePreValue)}+${formatFormulaValue(linkedExpectedValue)}`,
        };
    }

    return nextResolutions;
}
