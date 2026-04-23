import React from "react";
import {MatrixValidationIssue} from "@/src/features/matrix/model";
import {MatrixDensityProfile} from "./gridDensity";

interface MatrixValueCellProps {
    value: number | null;
    dynamicChipLabels?: string[];
    dynamicChipTone?: "normal" | "counter_hit" | "punish_counter";
    bodyCellKind?: "static" | "reference" | "dynamic_combo";
    isActive: boolean;
    isEditing: boolean;
    draft: string;
    draftHasFormatError?: boolean;
    issues?: MatrixValidationIssue[];
    axisHighlighted?: boolean;
    readOnly?: boolean;
    onOpenReferenceLink?: () => void;
    onOpenDynamicCombo?: () => void;
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
                                      dynamicChipLabels = [],
                                      dynamicChipTone = "normal",
                                      bodyCellKind,
                                      isActive,
                                     isEditing,
                                    draft,
                                    draftHasFormatError = false,
                                    issues = [],
                                     axisHighlighted = false,
                                     readOnly = false,
                                     onOpenReferenceLink,
                                      onOpenDynamicCombo,
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
                    border: draftHasFormatError ? "1px solid #d8642b" : "1px solid #a8c0d8",
                    background: draftHasFormatError ? "#fff3ea" : "#f8fbff",
                    borderRadius: 6,
                }}
                aria-invalid={draftHasFormatError}
                title={draftHasFormatError ? "Invalid number draft. You can keep typing before commit." : undefined}
            />
        );
    }

    const chipStyle =
        dynamicChipTone === "punish_counter"
            ? {background: "#ffe7ba", border: "1px solid #ffd591", color: "#ad4e00"}
            : dynamicChipTone === "counter_hit"
                ? {background: "#fffbe6", border: "1px solid #ffe58f", color: "#874d00"}
                : {background: "#f5f5f5", border: "1px solid #d9d9d9", color: "#434343"};

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
                if (bodyCellKind === "dynamic_combo" && onOpenDynamicCombo) {
                    onOpenDynamicCombo();
                    return;
                }

                if (bodyCellKind === "reference" && onOpenReferenceLink) {
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
                        ? "2px solid #d45454"
                        : isActive
                            ? "2px solid #3d71a8"
                            : "1px solid #b6c9dd",
                    background: readOnly
                        ? "#f2f6fb"
                        : hasCommittedError
                            ? "#fff2f2"
                            : axisHighlighted
                                ? "#f1f7ff"
                                : "#fff",
                    cursor: "pointer",
                    borderRadius: 6,
                    fontVariantNumeric: "tabular-nums",
                    padding: dynamicChipLabels.length > 0 ? "4px" : undefined,
                    textAlign: "left",
                }}
            aria-label={readOnly ? "Read-only cell" : "Editable cell"}
            title={issues[0]?.message}
        >
            {dynamicChipLabels.length > 0 ? (
                <span style={{display: "grid", gap: 4}}>
                    <span style={{display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center"}}>
                        {dynamicChipLabels.map((label, index) => (
                            <span
                                key={`${label}-${index}`}
                                style={{
                                    ...chipStyle,
                                    display: "inline-block",
                                    borderRadius: 999,
                                    padding: "1px 6px",
                                    fontSize: Math.max(10, densityProfile.valueFontSize - 1),
                                    lineHeight: 1.4,
                                    maxWidth: densityProfile.valueCellWidth - 12,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {label}
                            </span>
                        ))}
                    </span>
                    <span style={{fontSize: Math.max(10, densityProfile.valueFontSize - 1), color: "#595959"}}>
                        Current: {value === null ? "--" : value}
                    </span>
                </span>
            ) : value === null ? "" : value}
        </button>
    );
}

export const MatrixValueCell = React.memo(MatrixValueCellComponent, (previous, next) => {
    const previousFirstIssue = previous.issues?.[0];
    const nextFirstIssue = next.issues?.[0];

    return (
        previous.value === next.value &&
        previous.bodyCellKind === next.bodyCellKind &&
        (previous.dynamicChipLabels?.join("|") ?? "") === (next.dynamicChipLabels?.join("|") ?? "") &&
        previous.dynamicChipTone === next.dynamicChipTone &&
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
