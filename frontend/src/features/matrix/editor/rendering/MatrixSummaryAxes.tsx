import React from "react";

import {MatrixEditorState, MatrixValidationIssue, createColumnSummaryKey} from "@/src/features/matrix/model";
import {useMode} from "@/src/context/ThemeContext";
import {MatrixValueCell} from "./MatrixValueCell";
import {MatrixDensityProfile} from "./gridDensity";

interface MatrixSummaryAxesProps {
    state: MatrixEditorState;
    defenderCharacterName?: string | null;
    activeKey: string | null;
    activeColumnId: string | null;
    unavailableColumnIds: Set<string>;
    unavailableReasonByColumnId: Record<string, string>;
    editingKey: string | null;
    draft: string;
    draftHasFormatError: boolean;
    validationByKey: Record<string, MatrixValidationIssue[]>;
    canEditSummaries: boolean;
    onSelectColumnSummary: (columnId: string) => void;
    onSelectExpectedValue: () => void;
    onStartEdit: (key: string) => void;
    onStartOverwriteEdit: (key: string, firstCharacter: string) => void;
    onDraftChange: (value: string) => void;
    onCommitEdit: () => void;
    onCancelEdit: () => void;
    expectedValue: number | null;
    densityProfile: MatrixDensityProfile;
    summaryValueFormatter?: (value: number | null) => string;
}

export function MatrixSummaryAxes({
                                       state,
                                       defenderCharacterName,
                                       activeKey,
                                        activeColumnId,
                                        unavailableColumnIds,
                                        unavailableReasonByColumnId,
                                       editingKey,
                                       draft,
                                       draftHasFormatError,
                                       validationByKey,
                                       canEditSummaries,
                                        onSelectColumnSummary,
                                       onSelectExpectedValue,
                                       onStartEdit,
                                       onStartOverwriteEdit,
                                        onDraftChange,
                                        onCommitEdit,
                                        onCancelEdit,
                                     expectedValue,
                                     densityProfile,
                                     summaryValueFormatter,
                                     }: MatrixSummaryAxesProps) {
    const {theme} = useMode();
    return (
        <tfoot>
        <tr>
            <th
                style={{
                    textAlign: "left",
                    padding: `${densityProfile.cellPadding}px`,
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    background: theme.fgc.surface.subtle,
                    borderTop: `1px solid ${theme.fgc.border.default}`,
                    minWidth: densityProfile.rowLabelWidth,
                    fontSize: densityProfile.labelFontSize,
                    color: theme.fgc.text.secondary,
                }}
            >
                {defenderCharacterName ?? "P2"} Freq
            </th>
            {state.grid.columns.map((column) => {
                const columnUnavailable = unavailableColumnIds.has(column.id);
                return (
                    <td
                        key={column.id}
                        title={unavailableReasonByColumnId[column.id]}
                        style={{
                            padding: `${densityProfile.cellPadding}px`,
                            background: columnUnavailable ? theme.fgc.surface.sunken : activeColumnId === column.id ? theme.fgc.selection.hover : theme.fgc.surface.base,
                            borderTop: activeColumnId === column.id ? `2px solid ${theme.fgc.selection.active}` : `1px solid ${theme.fgc.border.subtle}`,
                            opacity: columnUnavailable ? 0.72 : 1,
                        }}
                    >
                    <MatrixValueCell
                        value={columnUnavailable ? 0 : state.grid.columnSummaryCells[createColumnSummaryKey(column.id)]?.value ?? null}
                        valueFormatter={summaryValueFormatter}
                        isActive={activeKey === createColumnSummaryKey(column.id)}
                        isEditing={editingKey === createColumnSummaryKey(column.id)}
                        draft={draft}
                        draftHasFormatError={editingKey === createColumnSummaryKey(column.id) ? draftHasFormatError : false}
                        issues={validationByKey[createColumnSummaryKey(column.id)] ?? []}
                        axisHighlighted={activeColumnId === column.id}
                        unavailable={columnUnavailable}
                        readOnly={!canEditSummaries}
                        onSelect={() => onSelectColumnSummary(column.id)}
                        onStartEdit={() => onStartEdit(createColumnSummaryKey(column.id))}
                        onStartOverwriteEdit={(firstCharacter) => onStartOverwriteEdit(createColumnSummaryKey(column.id), firstCharacter)}
                        onDraftChange={onDraftChange}
                        onCommitEdit={onCommitEdit}
                        onCancelEdit={onCancelEdit}
                        densityProfile={densityProfile}
                    />
                </td>
                );
            })}
            <td style={{padding: `${densityProfile.cellPadding}px`, fontWeight: 600}}>
                <MatrixValueCell
                    value={expectedValue}
                    isActive={activeKey === state.grid.expectedValueCell.key}
                    isEditing={editingKey === state.grid.expectedValueCell.key}
                    draft={draft}
                    issues={validationByKey[state.grid.expectedValueCell.key] ?? []}
                    readOnly
                    onSelect={onSelectExpectedValue}
                    onStartEdit={() => onStartEdit(state.grid.expectedValueCell.key)}
                    onStartOverwriteEdit={(firstCharacter) => onStartOverwriteEdit(state.grid.expectedValueCell.key, firstCharacter)}
                    onDraftChange={onDraftChange}
                    onCommitEdit={onCommitEdit}
                    onCancelEdit={onCancelEdit}
                    densityProfile={densityProfile}
                />
            </td>
            <td
                style={{
                    padding: `${densityProfile.cellPadding}px`,
                    fontSize: densityProfile.labelFontSize,
                    color: theme.fgc.text.secondary,
                    whiteSpace: "nowrap",
                }}
            >
                EV
            </td>
        </tr>
        </tfoot>
    );
}
