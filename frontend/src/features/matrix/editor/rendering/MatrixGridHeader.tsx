import React from "react";

import {MatrixEditorState} from "@/src/features/matrix/model";
import {useMode} from "@/src/context/ThemeContext";
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
    const {theme} = useMode();
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
                    background: theme.fgc.surface.subtle,
                    borderBottom: `1px solid ${theme.fgc.border.default}`,
                    minWidth: densityProfile.rowLabelWidth,
                    fontSize: densityProfile.labelFontSize,
                    color: theme.fgc.text.secondary,
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
                            background: activeColumnId === column.id ? theme.fgc.selection.hover : theme.fgc.surface.subtle,
                            borderBottom: activeColumnId === column.id ? `2px solid ${theme.fgc.selection.active}` : `1px solid ${theme.fgc.border.default}`,
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
                            border: `1px solid ${theme.fgc.border.default}`,
                            background: theme.fgc.control.default,
                            color: theme.fgc.text.primary,
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
                    background: theme.fgc.surface.subtle,
                    borderBottom: `1px solid ${theme.fgc.border.default}`,
                    minWidth: densityProfile.valueCellWidth,
                    fontSize: densityProfile.labelFontSize,
                    color: theme.fgc.text.secondary,
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
                    background: theme.fgc.surface.subtle,
                    borderBottom: `1px solid ${theme.fgc.border.default}`,
                    minWidth: 72,
                }}
            />
        </tr>
        </thead>
    );
}
