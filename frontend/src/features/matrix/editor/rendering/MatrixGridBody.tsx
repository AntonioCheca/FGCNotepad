import React from "react";

import {MatrixEditorState, MatrixValidationIssue, createBodyCellKey, createRowSummaryKey, isEditableBodyCell} from "@/src/features/matrix/model";
import {MatrixValueCell} from "./MatrixValueCell";
import {MatrixDensityProfile} from "./gridDensity";

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
    canEditAxisLabels: boolean;
    canEditBodyValues: boolean;
    canEditSummaries: boolean;
    onRowLabelChange: (rowId: string, label: string) => void;
    onSelectRowHeader: (rowId: string) => void;
    onSelectBodyCell: (rowId: string, columnId: string) => void;
    onSelectRowSummary: (rowId: string) => void;
    onOpenReferenceLink: (key: string) => void;
    onStartEdit: (key: string) => void;
    onStartOverwriteEdit: (key: string, firstCharacter: string) => void;
    onDraftChange: (value: string) => void;
    onCommitEdit: () => void;
    onCancelEdit: () => void;
    densityProfile: MatrixDensityProfile;
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
                                     canEditAxisLabels,
                                     canEditBodyValues,
                                     canEditSummaries,
                                     onRowLabelChange,
                                     onSelectRowHeader,
                                     onSelectBodyCell,
                                    onSelectRowSummary,
                                     onOpenReferenceLink,
                                    onStartEdit,
                                    onStartOverwriteEdit,
                                      onDraftChange,
                                      onCommitEdit,
                                      onCancelEdit,
                                      densityProfile,
                                   }: MatrixGridBodyProps) {
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
                        background: rowIsActive ? "#e6f7ff" : "#fcfcfc",
                        borderRight: rowIsActive ? "2px solid #1677ff" : "1px solid #f0f0f0",
                        minWidth: densityProfile.rowLabelWidth,
                    }}
                >
                    <input
                        type="text"
                        value={row.label}
                        readOnly={!canEditAxisLabels}
                        onFocus={() => onSelectRowHeader(row.id)}
                        onChange={(event) => onRowLabelChange(row.id, event.target.value)}
                        style={{
                            width: `${densityProfile.rowLabelWidth - 12}px`,
                            minHeight: densityProfile.cellHeight,
                            fontSize: densityProfile.labelFontSize,
                            padding: "2px 6px",
                        }}
                    />
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
                                background: axisHighlighted ? "#f6ffed" : "#fff",
                                border: axisHighlighted ? "1px solid #d9f7be" : "1px solid #f5f5f5",
                            }}
                        >
                            <MatrixValueCell
                                value={displayedBodyValues[key] ?? cell?.value ?? null}
                                isActive={activeKey === key}
                                isEditing={editingKey === key}
                                draft={draft}
                                draftHasFormatError={editingKey === key ? draftHasFormatError : false}
                                issues={validationByKey[key] ?? []}
                                axisHighlighted={axisHighlighted}
                                readOnly={!canEditBodyValues || !isEditableBodyCell(cell)}
                                onOpenReferenceLink={() => onOpenReferenceLink(key)}
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
                <td style={{padding: `${densityProfile.cellPadding}px`, background: rowIsActive ? "#e6f7ff" : "#fff"}}>
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
