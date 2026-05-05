import React from "react";

import {MatrixEditorState, MatrixValidationIssue, createBodyCellKey, createRowSummaryKey, isEditableBodyCell} from "@/src/features/matrix/model";
import {useMode} from "@/src/context/ThemeContext";
import {MatrixValueCell} from "./MatrixValueCell";
import {MatrixDensityProfile} from "./gridDensity";
import {MatrixLayerBadge} from "./MatrixLayerBadge";
import {AxisRequirementTrigger} from "./AxisRequirementEditor";

interface MatrixGridBodyProps {
    state: MatrixEditorState;
    activeKey: string | null;
    activeRowId: string | null;
    activeColumnId: string | null;
    unavailableRowIds: Set<string>;
    unavailableColumnIds: Set<string>;
    unavailableReasonByRowId: Record<string, string>;
    unavailableReasonByColumnId: Record<string, string>;
    editingKey: string | null;
    draft: string;
    draftHasFormatError: boolean;
    validationByKey: Record<string, MatrixValidationIssue[]>;
    displayedBodyValues: Record<string, number | null>;
    moveLabelById: Record<string, string>;
    canEditRowAxisLabels: boolean;
    canEditRowLayers: boolean;
    canEditBodyValues: boolean;
    canEditSummaries: boolean;
    onRowLabelChange: (rowId: string, label: string) => void;
    onRowLayerChange: (rowId: string, layer: number) => void;
    onOpenRowRequirements: (rowId: string, anchor: HTMLElement) => void;
    onSelectRowHeader: (rowId: string) => void;
    onSelectBodyCell: (rowId: string, columnId: string) => void;
    onSelectRowSummary: (rowId: string) => void;
    onOpenReferenceLink: (key: string) => void;
    onOpenDynamicCombo: (key: string) => void;
    onStartEdit: (key: string) => void;
    onStartOverwriteEdit: (key: string, firstCharacter: string) => void;
    onDraftChange: (value: string) => void;
    onCommitEdit: () => void;
    onCancelEdit: () => void;
    densityProfile: MatrixDensityProfile;
    showLayerControls: boolean;
    summaryValueFormatter?: (value: number | null) => string;
}

export function MatrixGridBody({
                                   state,
                                   activeKey,
                                   activeRowId,
                                   activeColumnId,
                                   unavailableRowIds,
                                   unavailableColumnIds,
                                   unavailableReasonByRowId,
                                   unavailableReasonByColumnId,
                                      editingKey,
                                     draft,
                                     draftHasFormatError,
                                       validationByKey,
                                       displayedBodyValues,
                                       moveLabelById,
                                      canEditRowAxisLabels,
                                      canEditRowLayers,
                                       canEditBodyValues,
                                       canEditSummaries,
                                        onRowLabelChange,
                                        onRowLayerChange,
                                        onOpenRowRequirements,
                                      onSelectRowHeader,
                                     onSelectBodyCell,
                                     onSelectRowSummary,
                                     onOpenReferenceLink,
                                     onOpenDynamicCombo,
                                     onStartEdit,
                                    onStartOverwriteEdit,
                                       onDraftChange,
                                       onCommitEdit,
                                       onCancelEdit,
                                       densityProfile,
                                      showLayerControls,
                                      summaryValueFormatter,
                                      }: MatrixGridBodyProps) {
    const {theme} = useMode();
    return (
        <tbody>
        {state.grid.rows.map((row) => {
            const rowIsActive = activeRowId === row.id;
            const rowUnavailable = unavailableRowIds.has(row.id);
            return (
            <tr key={row.id}>
                <th
                    title={unavailableReasonByRowId[row.id]}
                    style={{
                        textAlign: "left",
                        padding: `${densityProfile.cellPadding}px`,
                        position: "sticky",
                        left: 0,
                        zIndex: 3,
                        background: rowUnavailable ? theme.fgc.surface.sunken : rowIsActive ? theme.fgc.selection.hover : theme.fgc.surface.subtle,
                        borderRight: rowIsActive ? `2px solid ${theme.fgc.selection.active}` : `1px solid ${theme.fgc.border.default}`,
                        minWidth: densityProfile.rowLabelWidth,
                        height: densityProfile.cellHeight,
                        opacity: rowUnavailable ? 0.72 : 1,
                    }}
                >
                    <input
                        type="text"
                        value={row.label}
                        readOnly={!canEditRowAxisLabels}
                        onFocus={() => onSelectRowHeader(row.id)}
                        onChange={(event) => onRowLabelChange(row.id, event.target.value)}
                        style={{
                            width: `${densityProfile.rowLabelWidth - 12}px`,
                            minHeight: densityProfile.cellHeight,
                            fontSize: densityProfile.labelFontSize,
                            padding: "2px 6px",
                            borderRadius: 6,
                            border: `1px solid ${theme.fgc.border.default}`,
                            background: theme.fgc.control.default,
                            color: rowUnavailable ? theme.fgc.text.disabled : theme.fgc.text.primary,
                        }}
                    />
                    {rowUnavailable ? (
                        <span style={{position: "absolute", right: 4, top: 3, fontSize: 9, color: theme.fgc.text.disabled}}>
                            Unavailable
                        </span>
                    ) : null}
                    {showLayerControls ? (
                        <MatrixLayerBadge
                            value={row.layer}
                            readOnly={!canEditRowLayers}
                            axisLabel={row.label || "Row"}
                            onSelect={() => onSelectRowHeader(row.id)}
                            onChange={(nextLayer) => onRowLayerChange(row.id, nextLayer)}
                            densityProfile={densityProfile}
                        />
                    ) : null}
                    <AxisRequirementTrigger
                        axisLabel={row.label || "Row"}
                        requirements={row.requirements}
                        readOnly={!canEditRowAxisLabels}
                        isActive={rowIsActive}
                        onOpen={(anchor) => onOpenRowRequirements(row.id, anchor)}
                    />
                </th>
                {state.grid.columns.map((column) => {
                    const key = createBodyCellKey(row.id, column.id);
                    const cell = state.grid.bodyCells[key];
                    const axisHighlighted = rowIsActive || activeColumnId === column.id;
                    const columnUnavailable = unavailableColumnIds.has(column.id);
                    const cellUnavailable = rowUnavailable || columnUnavailable;
                    const unavailableReason = rowUnavailable ? unavailableReasonByRowId[row.id] : unavailableReasonByColumnId[column.id];
                    return (
                        <td
                            key={key}
                            title={unavailableReason}
                            style={{
                                padding: `${densityProfile.cellPadding}px`,
                                background: cellUnavailable ? theme.fgc.surface.sunken : axisHighlighted ? theme.fgc.selection.hover : theme.fgc.surface.base,
                                border: axisHighlighted ? `1px solid ${theme.fgc.border.default}` : `1px solid ${theme.fgc.border.subtle}`,
                                opacity: cellUnavailable ? 0.68 : 1,
                            }}
                        >
                            <MatrixValueCell
                                value={displayedBodyValues[key] ?? cell?.value ?? null}
                                bodyCellKind={cell?.kind}
                                dynamicChipLabels={
                                    cell?.kind === "dynamic_combo" && cell.dynamicCombo
                                        ? cell.dynamicCombo.starterMoveIds.map((moveId) => moveLabelById[moveId] ?? `Move #${moveId}`)
                                        : []
                                }
                                dynamicChipTone={
                                    cell?.kind === "dynamic_combo" && cell.dynamicCombo
                                        ? cell.dynamicCombo.starterContext.isPunishCounter
                                            ? "punish_counter"
                                            : cell.dynamicCombo.starterContext.isCounterHit
                                                ? "counter_hit"
                                                : "normal"
                                        : "normal"
                                }
                                isActive={activeKey === key}
                                isEditing={editingKey === key}
                                draft={draft}
                                draftHasFormatError={editingKey === key ? draftHasFormatError : false}
                                issues={validationByKey[key] ?? []}
                                axisHighlighted={axisHighlighted}
                                unavailable={cellUnavailable}
                                readOnly={!canEditBodyValues || !isEditableBodyCell(cell)}
                                onOpenReferenceLink={cell?.kind === "reference" ? () => onOpenReferenceLink(key) : undefined}
                                onOpenDynamicCombo={cell?.kind === "dynamic_combo" ? () => onOpenDynamicCombo(key) : undefined}
                                onSelect={() => onSelectBodyCell(row.id, column.id)}
                                onStartEdit={() => onStartEdit(key)}
                                onStartOverwriteEdit={(firstCharacter) => onStartOverwriteEdit(key, firstCharacter)}
                                onDraftChange={onDraftChange}
                                onCommitEdit={onCommitEdit}
                                onCancelEdit={onCancelEdit}
                                densityProfile={densityProfile}
                            />
                        </td>
                    );
                })}
                <td style={{padding: `${densityProfile.cellPadding}px`, background: rowIsActive ? theme.fgc.selection.hover : theme.fgc.surface.base}}>
                    <MatrixValueCell
                        value={rowUnavailable ? 0 : state.grid.rowSummaryCells[createRowSummaryKey(row.id)]?.value ?? null}
                        valueFormatter={summaryValueFormatter}
                        isActive={activeKey === createRowSummaryKey(row.id)}
                        isEditing={editingKey === createRowSummaryKey(row.id)}
                        draft={draft}
                        draftHasFormatError={editingKey === createRowSummaryKey(row.id) ? draftHasFormatError : false}
                        issues={validationByKey[createRowSummaryKey(row.id)] ?? []}
                        axisHighlighted={rowIsActive}
                        unavailable={rowUnavailable}
                        readOnly={!canEditSummaries}
                        onSelect={() => onSelectRowSummary(row.id)}
                        onStartEdit={() => onStartEdit(createRowSummaryKey(row.id))}
                        onStartOverwriteEdit={(firstCharacter) => onStartOverwriteEdit(createRowSummaryKey(row.id), firstCharacter)}
                        onDraftChange={onDraftChange}
                        onCommitEdit={onCommitEdit}
                        onCancelEdit={onCancelEdit}
                        densityProfile={densityProfile}
                    />
                </td>
                <td/>
            </tr>
            );
        })}
        </tbody>
    );
}
