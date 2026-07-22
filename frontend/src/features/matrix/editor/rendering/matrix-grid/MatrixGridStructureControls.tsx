import type {MatrixEditorPermissions} from "../../hooks/useMatrixEditorPermissions";

interface MatrixGridStructureControlsProps {
    permissions: MatrixEditorPermissions;
    selection: {
        columnId: string | null;
        rowId: string | null;
    };
    cellHeight: number;
    labelFontSize: number;
    borderColor: string;
    backgroundColor: string;
    onAddRow: () => void;
    onAddColumn: () => void;
    onRemoveRow: (rowId: string) => void;
    onRemoveColumn: (columnId: string) => void;
}

export function MatrixGridStructureControls({
    permissions,
    selection,
    cellHeight,
    labelFontSize,
    borderColor,
    backgroundColor,
    onAddRow,
    onAddColumn,
    onRemoveRow,
    onRemoveColumn,
}: MatrixGridStructureControlsProps) {
    if (!permissions.canEditRowStructure && !permissions.canEditColumnStructure) {
        return null;
    }

    const buttonStyle = {minHeight: cellHeight, fontSize: labelFontSize};
    const removableColumnId = permissions.canEditColumnStructure ? selection.columnId : null;
    const removableRowId = permissions.canEditRowStructure ? selection.rowId : null;

    return (
        <div
            style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "10px 12px",
                borderTop: `1px solid ${borderColor}`,
                background: backgroundColor,
                position: "sticky",
                bottom: 0,
            }}
        >
            {permissions.canEditRowStructure ? (
                <button type="button" onClick={onAddRow} style={buttonStyle}>
                    + Row
                </button>
            ) : null}
            {permissions.canEditColumnStructure ? (
                <button type="button" onClick={onAddColumn} style={buttonStyle}>
                    + Col
                </button>
            ) : null}
            {removableColumnId ? (
                <button type="button" onClick={() => onRemoveColumn(removableColumnId)} style={buttonStyle}>
                    - Col
                </button>
            ) : null}
            {removableRowId ? (
                <button type="button" onClick={() => onRemoveRow(removableRowId)} style={buttonStyle}>
                    - Row
                </button>
            ) : null}
        </div>
    );
}
