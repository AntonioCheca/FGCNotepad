import React from "react";

import {MatrixEditorState} from "@/src/features/matrix/model";
import {MatrixDensityProfile} from "./gridDensity";

interface MatrixGridHeaderProps {
    state: MatrixEditorState;
    activeColumnId: string | null;
    onColumnLabelChange: (columnId: string, label: string) => void;
    onAddColumn: () => void;
    densityProfile: MatrixDensityProfile;
}

export function MatrixGridHeader({state, activeColumnId, onColumnLabelChange, onAddColumn, densityProfile}: MatrixGridHeaderProps) {
    return (
        <thead>
        <tr>
            <th
                style={{
                    textAlign: "left",
                    padding: `${densityProfile.cellPadding}px`,
                    position: "sticky",
                    top: 0,
                    left: 0,
                    zIndex: 5,
                    background: "#fafafa",
                    borderBottom: "1px solid #d9d9d9",
                    minWidth: densityProfile.rowLabelWidth,
                    fontSize: densityProfile.labelFontSize,
                }}
            >
                P1 / P2
            </th>
            {state.grid.columns.map((column) => (
                <th
                    key={column.id}
                    style={{
                        padding: `${densityProfile.cellPadding}px`,
                        position: "sticky",
                        top: 0,
                        zIndex: 4,
                        background: activeColumnId === column.id ? "#e6f7ff" : "#fafafa",
                        borderBottom: activeColumnId === column.id ? "2px solid #1677ff" : "1px solid #d9d9d9",
                        minWidth: densityProfile.columnLabelWidth,
                    }}
                >
                    <input
                        type="text"
                        value={column.label}
                        onChange={(event) => onColumnLabelChange(column.id, event.target.value)}
                        style={{
                            width: `${densityProfile.columnLabelWidth - 12}px`,
                            minHeight: densityProfile.cellHeight,
                            fontSize: densityProfile.labelFontSize,
                            padding: "2px 6px",
                        }}
                    />
                </th>
            ))}
            <th
                style={{
                    padding: `${densityProfile.cellPadding}px`,
                    position: "sticky",
                    top: 0,
                    zIndex: 4,
                    background: "#fafafa",
                    borderBottom: "1px solid #d9d9d9",
                    minWidth: densityProfile.valueCellWidth,
                    fontSize: densityProfile.labelFontSize,
                }}
            >
                P1 Freq
            </th>
            <th
                style={{
                    padding: `${densityProfile.cellPadding}px`,
                    position: "sticky",
                    top: 0,
                    zIndex: 4,
                    background: "#fafafa",
                    borderBottom: "1px solid #d9d9d9",
                    minWidth: 72,
                }}
            >
                <button type="button" onClick={onAddColumn} style={{minHeight: densityProfile.cellHeight, fontSize: densityProfile.labelFontSize}}>+ Col</button>
            </th>
        </tr>
        </thead>
    );
}
