interface UseMatrixEditorPermissionsOptions {
    editable: boolean;
    allowRowStructureEdit?: boolean;
    allowColumnStructureEdit?: boolean;
    allowRowAxisLabelEdit?: boolean;
    allowColumnAxisLabelEdit?: boolean;
    allowRowLayerEdit?: boolean;
    allowColumnLayerEdit?: boolean;
}

export function useMatrixEditorPermissions({
    editable,
    allowRowStructureEdit,
    allowColumnStructureEdit,
    allowRowAxisLabelEdit,
    allowColumnAxisLabelEdit,
    allowRowLayerEdit,
    allowColumnLayerEdit,
}: UseMatrixEditorPermissionsOptions) {
    return {
        canEditRowStructure: editable && (allowRowStructureEdit ?? true),
        canEditColumnStructure: editable && (allowColumnStructureEdit ?? true),
        canEditRowAxisLabels: editable && (allowRowAxisLabelEdit ?? true),
        canEditColumnAxisLabels: editable && (allowColumnAxisLabelEdit ?? true),
        canEditRowLayers: editable && (allowRowLayerEdit ?? true),
        canEditColumnLayers: editable && (allowColumnLayerEdit ?? true),
        canEditBodyValues: editable,
        canEditReferences: editable,
        canEditDynamicCombos: editable,
        canEditSummaries: true,
    };
}

export type MatrixEditorPermissions = ReturnType<typeof useMatrixEditorPermissions>;
