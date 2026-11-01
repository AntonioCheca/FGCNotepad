import {MatrixEditorState, MatrixLinkedCellResolution, MatrixReferencePerspective} from "@/src/features/matrix/model";
import {buildPayoffMatrix, toSolveRowsAndColumns} from "./matrixSolveService";

// Same fixed number of passes as the server's linked-scenario iteration.
export const LINK_PASSES = 3;

// The linked EV counts with the cell's weight, subtracted when the linked scenario is the opponent's.
export function linkedEvFactor(weight: number, perspective: MatrixReferencePerspective | undefined): number {
    return perspective === "opponent" ? -weight : weight;
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

function getReferenceWeight(cell: MatrixEditorState["grid"]["bodyCells"][string]): number {
    return cell?.kind === "reference" ? cell.reference?.weight ?? 1 : 1;
}

function getReferencePerspective(cell: MatrixEditorState["grid"]["bodyCells"][string]): MatrixReferencePerspective {
    return cell?.kind === "reference" ? cell.reference?.perspective ?? "same" : "same";
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

    const layerLimit = getMaxLayer(state);
    const {rows, columns} = toSolveRowsAndColumns(state, layerLimit);

    async function solveWith(selfValues: Record<string, number>): Promise<number> {
        const payoffMatrix = buildPayoffMatrix({
            state,
            rows,
            columns,
            displayedBodyValues: {...baseDisplayedBodyValues, ...selfValues},
            dynamicOverrides: {},
        });

        const result = await solveGame(payoffMatrix);
        return toExpectedValue(result, payoffMatrix);
    }

    // Fixed-point passes, as on the server: pass 0 uses each cell's stored total (or its pre-value), and pass n
    // feeds the EV of pass n-1 back into the self-linked cells. It stops after LINK_PASSES, so it cannot loop.
    const selfValues: Record<string, number> = {};
    for (const key of selfReferenceKeys) {
        const cell = state.grid.bodyCells[key];
        selfValues[key] = cell.reference?.cachedValue ?? getStaticPreValue(cell);
    }

    let expectedValue = await solveWith(selfValues);
    let linkedExpectedValue = expectedValue;
    for (let pass = 1; pass <= LINK_PASSES; pass += 1) {
        linkedExpectedValue = expectedValue;
        for (const key of selfReferenceKeys) {
            const cell = state.grid.bodyCells[key];
            selfValues[key] = getStaticPreValue(cell) + linkedEvFactor(getReferenceWeight(cell), getReferencePerspective(cell)) * linkedExpectedValue;
        }
        expectedValue = await solveWith(selfValues);
    }

    const nextResolutions = {...existingResolutions};
    for (const key of selfReferenceKeys) {
        const cell = state.grid.bodyCells[key];
        nextResolutions[key] = {
            basePreValue: getStaticPreValue(cell),
            linkedExpectedValue,
            weight: getReferenceWeight(cell),
            perspective: getReferencePerspective(cell),
            finalValue: selfValues[key],
        };
    }

    return nextResolutions;
}
