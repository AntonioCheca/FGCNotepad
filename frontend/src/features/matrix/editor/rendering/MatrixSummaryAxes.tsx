import React from "react";

import {MatrixEditorState, MatrixValidationIssue, createColumnSummaryKey} from "@/src/features/matrix/model";
import {MatrixValueCell} from "./MatrixValueCell";
import {MatrixDensityProfile} from "./gridDensity";

interface MatrixSummaryAxesProps {
    state: MatrixEditorState;
    activeKey: string | null;
    activeColumnId: string | null;
    editingKey: string | null;
    draft: string;
    draftHasFormatError: boolean;
    validationByKey: Record<string, MatrixValidationIssue[]>;
    onSelectColumnSummary: (columnId: string) => void;
    onSelectExpectedValue: () => void;
    onStartEdit: (key: string) => void;
    onDraftChange: (value: string) => void;
    onCommitEdit: () => void;
    onCancelEdit: () => void;
    expectedValue: number | null;
    densityProfile: MatrixDensityProfile;
}

export function MatrixSummaryAxes({
                                       state,
                                       activeKey,
                                       activeColumnId,
                                       editingKey,
                                      draft,
                                      draftHasFormatError,
                                      validationByKey,
                                      onSelectColumnSummary,
                                      onSelectExpectedValue,
                                      onStartEdit,
                                       onDraftChange,
                                       onCommitEdit,
                                       onCancelEdit,
                                       expectedValue,
                                       densityProfile,
                                   }: MatrixSummaryAxesProps) {
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
                    background: "#fafafa",
                    borderTop: "1px solid #d9d9d9",
                    minWidth: densityProfile.rowLabelWidth,
                    fontSize: densityProfile.labelFontSize,
                }}
            >
                P2 Freq
            </th>
            {state.grid.columns.map((column) => (
                <td
                    key={column.id}
                    style={{
                        padding: `${densityProfile.cellPadding}px`,
                        background: activeColumnId === column.id ? "#e6f7ff" : "#fff",
                        borderTop: activeColumnId === column.id ? "2px solid #1677ff" : "1px solid #f0f0f0",
                    }}
                >
                    <MatrixValueCell
                        value={state.grid.columnSummaryCells[createColumnSummaryKey(column.id)]?.value ?? null}
                        isActive={activeKey === createColumnSummaryKey(column.id)}
                        isEditing={editingKey === createColumnSummaryKey(column.id)}
                        draft={draft}
                        draftHasFormatError={editingKey === createColumnSummaryKey(column.id) ? draftHasFormatError : false}
                        issues={validationByKey[createColumnSummaryKey(column.id)] ?? []}
                        axisHighlighted={activeColumnId === column.id}
                        onSelect={() => onSelectColumnSummary(column.id)}
                        onStartEdit={() => onStartEdit(createColumnSummaryKey(column.id))}
                        onDraftChange={onDraftChange}
                        onCommitEdit={onCommitEdit}
                        onCancelEdit={onCancelEdit}
                        densityProfile={densityProfile}
                    />
                </td>
            ))}
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
                    onDraftChange={onDraftChange}
                    onCommitEdit={onCommitEdit}
                    onCancelEdit={onCancelEdit}
                    densityProfile={densityProfile}
                />
            </td>
            <td/>
        </tr>
        </tfoot>
    );
}
