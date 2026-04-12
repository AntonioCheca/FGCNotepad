import React from "react";

import {MatrixDensityMode, MatrixEditorState, MatrixValidationIssue} from "@/src/features/matrix/model";
import {MatrixGridHeader} from "./MatrixGridHeader";
import {MatrixGridBody} from "./MatrixGridBody";
import {MatrixSummaryAxes} from "./MatrixSummaryAxes";
import {resolveDensityProfile} from "./gridDensity";

interface MatrixGridProps {
    state: MatrixEditorState;
    expectedValue: number | null;
    activeKey: string | null;
    activeRowId: string | null;
    activeColumnId: string | null;
    editingKey: string | null;
    draft: string;
    draftHasFormatError: boolean;
    validationByKey: Record<string, MatrixValidationIssue[]>;
    displayedBodyValues: Record<string, number | null>;
    onAddRow: () => void;
    onAddColumn: () => void;
    onRowLabelChange: (rowId: string, label: string) => void;
    onColumnLabelChange: (columnId: string, label: string) => void;
    onSelectBodyCell: (rowId: string, columnId: string) => void;
    onSelectRowSummary: (rowId: string) => void;
    onOpenReferenceLink: (key: string) => void;
    onSelectColumnSummary: (columnId: string) => void;
    onSelectExpectedValue: () => void;
    onStartEdit: (key: string) => void;
    onDraftChange: (draft: string) => void;
    onCommitEdit: () => void;
    onCancelEdit: () => void;
    density: MatrixDensityMode;
}

export function MatrixGrid({
                               state,
                               expectedValue,
                               activeKey,
                               activeRowId,
                               activeColumnId,
                               editingKey,
                               draft,
                               draftHasFormatError,
                               validationByKey,
                               displayedBodyValues,
                               onAddRow,
                               onAddColumn,
                               onRowLabelChange,
                               onColumnLabelChange,
                               onSelectBodyCell,
                               onSelectRowSummary,
                               onOpenReferenceLink,
                               onSelectColumnSummary,
                               onSelectExpectedValue,
                               onStartEdit,
                                onDraftChange,
                                onCommitEdit,
                                onCancelEdit,
                                density,
                            }: MatrixGridProps) {
    const profile = React.useMemo(
        () => resolveDensityProfile(density, state.grid.rows.length, state.grid.columns.length),
        [density, state.grid.rows.length, state.grid.columns.length]
    );

    return (
        <div
            style={{
                overflow: "auto",
                maxWidth: "100%",
                maxHeight: "64vh",
                border: "1px solid #e8e8e8",
                borderRadius: 8,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
            }}
        >
            <table
                style={{
                    borderCollapse: "separate",
                    borderSpacing: 0,
                    width: "max-content",
                    minWidth: "100%",
                    fontSize: profile.valueFontSize,
                    lineHeight: 1.2,
                }}
            >
                <MatrixGridHeader
                    state={state}
                    activeColumnId={activeColumnId}
                    onColumnLabelChange={onColumnLabelChange}
                    onAddColumn={onAddColumn}
                    densityProfile={profile}
                />
                <MatrixGridBody
                    state={state}
                    activeKey={activeKey}
                    activeRowId={activeRowId}
                    activeColumnId={activeColumnId}
                    editingKey={editingKey}
                    draft={draft}
                    draftHasFormatError={draftHasFormatError}
                    validationByKey={validationByKey}
                    displayedBodyValues={displayedBodyValues}
                    onRowLabelChange={onRowLabelChange}
                    onSelectBodyCell={onSelectBodyCell}
                    onSelectRowSummary={onSelectRowSummary}
                    onOpenReferenceLink={onOpenReferenceLink}
                    onStartEdit={onStartEdit}
                    onDraftChange={onDraftChange}
                    onCommitEdit={onCommitEdit}
                    onCancelEdit={onCancelEdit}
                    onAddRow={onAddRow}
                    densityProfile={profile}
                />
                <MatrixSummaryAxes
                    state={state}
                    activeKey={activeKey}
                    activeColumnId={activeColumnId}
                    editingKey={editingKey}
                    draft={draft}
                    draftHasFormatError={draftHasFormatError}
                    validationByKey={validationByKey}
                    onSelectColumnSummary={onSelectColumnSummary}
                    onSelectExpectedValue={onSelectExpectedValue}
                    onStartEdit={onStartEdit}
                    onDraftChange={onDraftChange}
                    onCommitEdit={onCommitEdit}
                    onCancelEdit={onCancelEdit}
                    expectedValue={expectedValue}
                    densityProfile={profile}
                />
            </table>
        </div>
    );
}
