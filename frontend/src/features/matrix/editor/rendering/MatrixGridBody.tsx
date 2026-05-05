import React from "react";

import {MatrixEditorState, MatrixValidationIssue, createBodyCellKey, createRowSummaryKey, isEditableBodyCell} from "@/src/features/matrix/model";
import {useMode} from "@/src/context/ThemeContext";
import {MatrixValueCell} from "./MatrixValueCell";
import {MatrixDensityProfile} from "./gridDensity";
import {MatrixLayerBadge} from "./MatrixLayerBadge";

interface MatrixGridBodyProps {
    state: MatrixEditorState;
    activeKey: string | null;
    activeRowId: string | null;
    activeColumnId: string | null;
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
}

export function MatrixGridBody({
                                   state,
                                   activeKey,
                                   activeRowId,
                                   activeColumnId,
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
                                     }: MatrixGridBodyProps) {
    const {theme} = useMode();
    return (
        <tbody>
        {state.grid.rows.map((row) => {
            const rowIsActive = activeRowId === row.id;
            return (
            <tr key={row.id}>
                <th
                    style={{
                        textAlign: "left",
                        padding: `${densityProfile.cellPadding}px`,
                        position: "sticky",
                        left: 0,
                        zIndex: 3,
                        background: rowIsActive ? theme.fgc.selection.hover : theme.fgc.surface.subtle,
                        borderRight: rowIsActive ? `2px solid ${theme.fgc.selection.active}` : `1px solid ${theme.fgc.border.default}`,
                        minWidth: densityProfile.rowLabelWidth,
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
                            color: theme.fgc.text.primary,
                        }}
                    />
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
                </th>
                {state.grid.columns.map((column) => {
                    const key = createBodyCellKey(row.id, column.id);
                    const cell = state.grid.bodyCells[key];
                    const axisHighlighted = rowIsActive || activeColumnId === column.id;
                    return (
                        <td
                            key={key}
                            style={{
                                padding: `${densityProfile.cellPadding}px`,
                                background: axisHighlighted ? theme.fgc.selection.hover : theme.fgc.surface.base,
                                border: axisHighlighted ? `1px solid ${theme.fgc.border.default}` : `1px solid ${theme.fgc.border.subtle}`,
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
                        value={state.grid.rowSummaryCells[createRowSummaryKey(row.id)]?.value ?? null}
                        isActive={activeKey === createRowSummaryKey(row.id)}
                        isEditing={editingKey === createRowSummaryKey(row.id)}
                        draft={draft}
                        draftHasFormatError={editingKey === createRowSummaryKey(row.id) ? draftHasFormatError : false}
                        issues={validationByKey[createRowSummaryKey(row.id)] ?? []}
                        axisHighlighted={rowIsActive}
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
