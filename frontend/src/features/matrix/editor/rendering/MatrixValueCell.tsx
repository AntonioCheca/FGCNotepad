import React from "react";
import {MatrixValidationIssue} from "@/src/features/matrix/model";
import {MatrixDensityProfile} from "./gridDensity";

interface MatrixValueCellProps {
    value: number | null;
    isActive: boolean;
    isEditing: boolean;
    draft: string;
    draftHasFormatError?: boolean;
    issues?: MatrixValidationIssue[];
    axisHighlighted?: boolean;
    readOnly?: boolean;
    onOpenReferenceLink?: () => void;
    onSelect: () => void;
    onStartEdit: () => void;
    onStartOverwriteEdit: (firstCharacter: string) => void;
    onDraftChange: (next: string) => void;
    onCommitEdit: () => void;
    onCancelEdit: () => void;
    densityProfile: MatrixDensityProfile;
}

function isPrintableKey(event: React.KeyboardEvent<HTMLButtonElement>): boolean {
    return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

function MatrixValueCellComponent({
                                     value,
                                     isActive,
                                     isEditing,
                                    draft,
                                    draftHasFormatError = false,
                                    issues = [],
                                    axisHighlighted = false,
                                    readOnly = false,
                                    onOpenReferenceLink,
                                     onSelect,
                                     onStartEdit,
                                     onStartOverwriteEdit,
                                      onDraftChange,
                                      onCommitEdit,
                                      onCancelEdit,
                                      densityProfile,
                                  }: MatrixValueCellProps) {
    const hasCommittedError = issues.length > 0;

    if (isEditing) {
        return (
            <input
                autoFocus
                type="text"
                value={draft}
                onChange={(event) => onDraftChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        onCommitEdit();
                    } else if (event.key === "Escape") {
                        event.preventDefault();
                        onCancelEdit();
                    }
                }}
                onBlur={onCommitEdit}
                style={{
                    width: `${densityProfile.valueCellWidth}px`,
                    minHeight: densityProfile.cellHeight,
                    fontSize: densityProfile.valueFontSize,
                    padding: "1px 6px",
                    border: draftHasFormatError ? "1px solid #fa541c" : "1px solid #d9d9d9",
                    background: draftHasFormatError ? "#fff2e8" : "#fff",
                    borderRadius: 4,
                }}
                aria-invalid={draftHasFormatError}
                title={draftHasFormatError ? "Invalid number draft. You can keep typing before commit." : undefined}
            />
        );
    }

    return (
        <button
            type="button"
            onClick={onSelect}
            onKeyDown={(event) => {
                if (readOnly) {
                    return;
                }

                if (isPrintableKey(event)) {
                    event.preventDefault();
                    onSelect();
                    onStartOverwriteEdit(event.key);
                }
            }}
            onDoubleClick={() => {
                if (readOnly && onOpenReferenceLink) {
                    onOpenReferenceLink();
                    return;
                }

                if (!readOnly) {
                    onStartEdit();
                }
            }}
                style={{
                    width: `${densityProfile.valueCellWidth}px`,
                    minHeight: densityProfile.cellHeight,
                    fontSize: densityProfile.valueFontSize,
                    border: hasCommittedError
                        ? "2px solid #ff4d4f"
                        : isActive
                            ? "2px solid #1677ff"
                            : "1px solid #d9d9d9",
                    background: readOnly
                        ? "#f5f5f5"
                        : hasCommittedError
                            ? "#fff1f0"
                            : axisHighlighted
                                ? "#f6ffed"
                                : "#fff",
                    cursor: "pointer",
                    borderRadius: 4,
                    fontVariantNumeric: "tabular-nums",
                }}
            aria-label={readOnly ? "Read-only cell" : "Editable cell"}
            title={issues[0]?.message}
        >
            {value === null ? "" : value}
        </button>
    );
}

export const MatrixValueCell = React.memo(MatrixValueCellComponent, (previous, next) => {
    const previousFirstIssue = previous.issues?.[0];
    const nextFirstIssue = next.issues?.[0];

    return (
        previous.value === next.value &&
        previous.isActive === next.isActive &&
        previous.isEditing === next.isEditing &&
        previous.draft === next.draft &&
        previous.draftHasFormatError === next.draftHasFormatError &&
        previous.axisHighlighted === next.axisHighlighted &&
        previous.readOnly === next.readOnly &&
        (previous.issues?.length ?? 0) === (next.issues?.length ?? 0) &&
        previousFirstIssue?.code === nextFirstIssue?.code &&
        previousFirstIssue?.message === nextFirstIssue?.message &&
        previous.densityProfile === next.densityProfile
    );
});
