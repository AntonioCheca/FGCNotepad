import React from "react";

import {MatrixEditorState} from "@/src/features/matrix/model";
import {MatrixDensityProfile} from "./gridDensity";
import {MatrixLayerBadge} from "./MatrixLayerBadge";

interface MatrixGridHeaderProps {
    state: MatrixEditorState;
    activeColumnId: string | null;
    canEditColumnAxisLabels: boolean;
    canEditColumnLayers: boolean;
    onColumnLabelChange: (columnId: string, label: string) => void;
    onColumnLayerChange: (columnId: string, layer: number) => void;
    onSelectColumnHeader: (columnId: string) => void;
    densityProfile: MatrixDensityProfile;
    showLayerControls: boolean;
}

export function MatrixGridHeader({
    state,
    activeColumnId,
    canEditColumnAxisLabels,
    canEditColumnLayers,
    onColumnLabelChange,
    onColumnLayerChange,
    onSelectColumnHeader,
    densityProfile,
    showLayerControls,
}: MatrixGridHeaderProps) {
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
            {state.grid.columns.map((column) => {
                return (
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
                        readOnly={!canEditColumnAxisLabels}
                        onFocus={() => onSelectColumnHeader(column.id)}
                        onChange={(event) => onColumnLabelChange(column.id, event.target.value)}
                        style={{
                            width: `${densityProfile.columnLabelWidth - 12}px`,
                            minHeight: densityProfile.cellHeight,
                            fontSize: densityProfile.labelFontSize,
                            padding: "2px 6px",
                        }}
                    />
                    {showLayerControls ? (
                        <MatrixLayerBadge
                            value={column.layer}
                            readOnly={!canEditColumnLayers}
                            axisLabel={column.label || "Column"}
                            onSelect={() => onSelectColumnHeader(column.id)}
                            onChange={(nextLayer) => onColumnLayerChange(column.id, nextLayer)}
                            densityProfile={densityProfile}
                        />
                    ) : null}
                    </th>
                );
            })}
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
            />
        </tr>
        </thead>
    );
}
