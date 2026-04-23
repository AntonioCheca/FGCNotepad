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
                    background: "#eef4fb",
                    borderBottom: "1px solid #c6d5e5",
                    minWidth: densityProfile.rowLabelWidth,
                    fontSize: densityProfile.labelFontSize,
                    color: "#2e4b6d",
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
                            background: activeColumnId === column.id ? "#dfeefe" : "#eef4fb",
                            borderBottom: activeColumnId === column.id ? "2px solid #3c71a8" : "1px solid #c6d5e5",
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
                            borderRadius: 6,
                            border: "1px solid #b8c9dc",
                            background: "#fff",
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
                    background: "#eef4fb",
                    borderBottom: "1px solid #c6d5e5",
                    minWidth: densityProfile.valueCellWidth,
                    fontSize: densityProfile.labelFontSize,
                    color: "#2e4b6d",
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
                    background: "#eef4fb",
                    borderBottom: "1px solid #c6d5e5",
                    minWidth: 72,
                }}
            />
        </tr>
        </thead>
    );
}
