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
    onRowLabelChange: (rowId: string, label: string) => void;
    onSelectBodyCell: (rowId: string, columnId: string) => void;
    onSelectRowSummary: (rowId: string) => void;
    onOpenReferenceLink: (key: string) => void;
    onStartEdit: (key: string) => void;
    onDraftChange: (value: string) => void;
    onCommitEdit: () => void;
    onCancelEdit: () => void;
    onAddRow: () => void;
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
                                   onRowLabelChange,
                                   onSelectBodyCell,
                                   onSelectRowSummary,
                                   onOpenReferenceLink,
                                   onStartEdit,
                                    onDraftChange,
                                    onCommitEdit,
                                    onCancelEdit,
                                    onAddRow,
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
                                readOnly={!isEditableBodyCell(cell)}
                                onOpenReferenceLink={() => onOpenReferenceLink(key)}
                                onSelect={() => onSelectBodyCell(row.id, column.id)}
                                onStartEdit={() => onStartEdit(key)}
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
                        onSelect={() => onSelectRowSummary(row.id)}
                        onStartEdit={() => onStartEdit(createRowSummaryKey(row.id))}
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
        <tr>
            <td
                style={{
                    padding: `${densityProfile.cellPadding}px`,
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    background: "#fafafa",
                }}
            >
                <button type="button" onClick={onAddRow} style={{minHeight: densityProfile.cellHeight, fontSize: densityProfile.labelFontSize}}>+ Row</button>
            </td>
            <td colSpan={state.grid.columns.length + 2}/>
        </tr>
        </tbody>
    );
}
