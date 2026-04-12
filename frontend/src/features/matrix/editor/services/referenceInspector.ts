import {MatrixEditorState, MatrixSelectionTarget} from "@/src/features/matrix/model";

export interface ReferenceInspectorData {
    cellKey: string;
    scenarioId: string;
    scenarioName: string;
    referenceKind: "reference" | "computed";
    resolvedValue: number | null;
    cachedValue: number | null;
    metadata: Array<{ label: string; value: string }>;
}

function toMetadataList(value: unknown): Array<{ label: string; value: string }> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return [];
    }

    const record = value as Record<string, unknown>;
    return Object.entries(record)
        .filter(([, itemValue]) => {
            return (
                typeof itemValue === "string" ||
                typeof itemValue === "number" ||
                typeof itemValue === "boolean"
            );
        })
        .slice(0, 6)
        .map(([key, itemValue]) => ({
            label: key,
            value: String(itemValue),
        }));
}

export function buildReferenceInspectorData(
    state: MatrixEditorState,
    selectedTarget: MatrixSelectionTarget | null,
    displayedBodyValues: Record<string, number | null>,
    referenceMetadataByScenarioId: Record<string, unknown>
): ReferenceInspectorData | null {
    if (!selectedTarget || selectedTarget.zone !== "body") {
        return null;
    }

    const cell = state.grid.bodyCells[selectedTarget.key];
    if (!cell || cell.kind !== "reference" || !cell.reference) {
        return null;
    }

    const sourceMetadata = referenceMetadataByScenarioId[cell.reference.scenarioId];
    const metadataList = toMetadataList(sourceMetadata);

    const metadataName =
        typeof sourceMetadata === "object" && sourceMetadata !== null && !Array.isArray(sourceMetadata)
            ? (sourceMetadata as Record<string, unknown>).name
            : undefined;

    return {
        cellKey: cell.key,
        scenarioId: cell.reference.scenarioId,
        scenarioName:
            cell.reference.scenarioLabel ??
            (typeof metadataName === "string" && metadataName.trim() !== "" ? metadataName : "Linked Scenario"),
        referenceKind: cell.reference.kind,
        resolvedValue: displayedBodyValues[cell.key] ?? cell.value,
        cachedValue: cell.reference.cachedValue,
        metadata: metadataList,
    };
}
