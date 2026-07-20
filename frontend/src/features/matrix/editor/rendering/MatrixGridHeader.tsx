import React from "react";

import {MatrixEditorState} from "@/src/features/matrix/model";
import {useMode} from "@/src/context/ThemeContext";
import {MatrixDensityProfile} from "./gridDensity";
import {MatrixLayerBadge} from "./MatrixLayerBadge";
import {AxisRequirementTrigger} from "./AxisRequirementEditor";

interface MatrixGridHeaderProps {
    state: MatrixEditorState;
    attackerCharacterName?: string | null;
    defenderCharacterName?: string | null;
    activeColumnId: string | null;
    unavailableColumnIds: Set<string>;
    unavailableReasonByColumnId: Record<string, string>;
    canEditColumnAxisLabels: boolean;
    canEditColumnLayers: boolean;
    onColumnLabelChange: (columnId: string, label: string) => void;
    onColumnLayerChange: (columnId: string, layer: number) => void;
    onOpenColumnRequirements: (columnId: string, anchor: HTMLElement) => void;
    onSelectColumnHeader: (columnId: string) => void;
    densityProfile: MatrixDensityProfile;
    showLayerControls: boolean;
}

export function MatrixGridHeader({
    state,
    attackerCharacterName,
    defenderCharacterName,
    activeColumnId,
    unavailableColumnIds,
    unavailableReasonByColumnId,
    canEditColumnAxisLabels,
    canEditColumnLayers,
    onColumnLabelChange,
    onColumnLayerChange,
    onOpenColumnRequirements,
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
                {attackerCharacterName ?? "P1"} / {defenderCharacterName ?? "P2"}
            </th>
            {state.grid.columns.map((column) => {
                const columnUnavailable = unavailableColumnIds.has(column.id);
                return (
                    <th
                        key={column.id}
                        title={unavailableReasonByColumnId[column.id]}
                        style={{
                            padding: `${densityProfile.cellPadding}px`,
                            position: "sticky",
                            top: 0,
                            zIndex: 4,
                            background: columnUnavailable ? theme.fgc.surface.sunken : activeColumnId === column.id ? theme.fgc.selection.hover : theme.fgc.surface.subtle,
                            borderBottom: activeColumnId === column.id ? `2px solid ${theme.fgc.selection.active}` : `1px solid ${theme.fgc.border.default}`,
                            minWidth: densityProfile.columnLabelWidth,
                            height: densityProfile.cellHeight + (showLayerControls ? 20 : 0) + densityProfile.cellPadding * 2,
                            opacity: columnUnavailable ? 0.72 : 1,
                        }}
                    >
                    <input
                        type="text"
                        aria-label={`Column label ${column.label || column.id}`}
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
                            color: columnUnavailable ? theme.fgc.text.disabled : theme.fgc.text.primary,
                        }}
                    />
                    {columnUnavailable ? (
                        <span style={{position: "absolute", right: 4, top: 3, fontSize: 9, color: theme.fgc.text.disabled}}>
                            Unavailable
                        </span>
                    ) : null}
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
                    <AxisRequirementTrigger
                        axisLabel={column.label || "Column"}
                        requirements={column.requirements}
                        readOnly={!canEditColumnAxisLabels}
                        isActive={activeColumnId === column.id}
                        onOpen={(anchor) => onOpenColumnRequirements(column.id, anchor)}
                    />
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
                {attackerCharacterName ?? "P1"} Freq
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
