import {MatrixBodyCell, MatrixEditorState, MatrixValidationIssue} from "@/src/features/matrix/model";

export interface MatrixReferenceResolver {
    resolve: (reference: NonNullable<MatrixBodyCell["reference"]>, cell: MatrixBodyCell) => number | null | undefined;
}

export interface ReferenceResolutionResult {
    displayedBodyValues: Record<string, number | null>;
    cacheUpdates: Array<{ key: string; cachedValue: number | null }>;
    issues: MatrixValidationIssue[];
}

interface ResolveReferenceDisplayValuesOptions {
    cellValueByKey?: Record<string, number>;
    resolverExpected?: boolean;
}

function issue(message: string): MatrixValidationIssue {
    return {code: "unknown", message};
}

export function resolveReferenceDisplayValues(
    state: MatrixEditorState,
    resolver: MatrixReferenceResolver,
    options: ResolveReferenceDisplayValuesOptions = {}
): ReferenceResolutionResult {
    const displayedBodyValues: Record<string, number | null> = {};
    const cacheUpdates: Array<{ key: string; cachedValue: number | null }> = [];
    const issues: MatrixValidationIssue[] = [];

    Object.values(state.grid.bodyCells).forEach((cell) => {
        if (cell.kind !== "reference" || !cell.reference) {
            displayedBodyValues[cell.key] = cell.value;
            return;
        }

        const cellResolvedValue = options.cellValueByKey?.[cell.key];
        if (typeof cellResolvedValue === "number" && Number.isFinite(cellResolvedValue)) {
            displayedBodyValues[cell.key] = cellResolvedValue;
            if (cell.reference.cachedValue !== cellResolvedValue || cell.value !== cellResolvedValue) {
                cacheUpdates.push({key: cell.key, cachedValue: cellResolvedValue});
            }
            return;
        }

        try {
            const resolved = resolver.resolve(cell.reference, cell);
            if (typeof resolved === "number" && Number.isFinite(resolved)) {
                displayedBodyValues[cell.key] = resolved;
                if (cell.reference.cachedValue !== resolved || cell.value !== resolved) {
                    cacheUpdates.push({key: cell.key, cachedValue: resolved});
                }
                return;
            }

            const fallback = cell.reference.cachedValue ?? cell.value ?? null;
            displayedBodyValues[cell.key] = fallback;
            if (options.resolverExpected) {
                issues.push(issue(`Reference ${cell.reference.scenarioId} is unavailable; showing cached value.`));
            }
        } catch {
            const fallback = cell.reference.cachedValue ?? cell.value ?? null;
            displayedBodyValues[cell.key] = fallback;
            if (options.resolverExpected) {
                issues.push(issue(`Reference ${cell.reference.scenarioId} failed to resolve; showing cached value.`));
            }
        }
    });

    return {
        displayedBodyValues,
        cacheUpdates,
        issues,
    };
}

export function createMapReferenceResolver(referenceValueByScenarioId: Record<string, unknown>): MatrixReferenceResolver {
    return {
        resolve: (reference) => {
            const raw = referenceValueByScenarioId[reference.scenarioId];
            if (typeof raw === "number" && Number.isFinite(raw)) {
                return raw;
            }

            if (typeof raw === "string") {
                const parsed = Number(raw.trim());
                return Number.isFinite(parsed) ? parsed : undefined;
            }

            return undefined;
        },
    };
}
