import React from "react";
import {MatrixValidationIssue} from "@/src/features/matrix/model";
import {useMode} from "@/src/context/ThemeContext";
import {MatrixDensityProfile} from "./gridDensity";

interface MatrixValueCellProps {
    value: number | null;
    valueFormatter?: (value: number | null) => string;
    displayLabel?: string;
    dynamicChipLabels?: string[];
    dynamicChipTone?: "normal" | "counter_hit" | "punish_counter";
    bodyCellKind?: "static" | "reference" | "dynamic_combo";
    isActive: boolean;
    isEditing: boolean;
    draft: string;
    draftHasFormatError?: boolean;
    issues?: MatrixValidationIssue[];
    axisHighlighted?: boolean;
    unavailable?: boolean;
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
                                        valueFormatter,
                                        displayLabel,
                                        dynamicChipLabels = [],
                                      dynamicChipTone = "normal",
                                      bodyCellKind,
                                      isActive,
                                     isEditing,
                                    draft,
                                    draftHasFormatError = false,
                                     issues = [],
                                      axisHighlighted = false,
                                      unavailable = false,
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
    const {theme} = useMode();
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
                    border: draftHasFormatError ? `1px solid ${theme.fgc.feedback.warning}` : `1px solid ${theme.fgc.border.default}`,
                    background: draftHasFormatError ? theme.fgc.chip.warningBg : theme.fgc.control.default,
                    color: theme.fgc.text.primary,
                    borderRadius: 6,
                }}
                aria-invalid={draftHasFormatError}
                title={draftHasFormatError ? "Invalid number draft. You can keep typing before commit." : undefined}
            />
        );
    }

    const chipStyle =
        dynamicChipTone === "punish_counter"
            ? {background: theme.fgc.chip.warningBg, border: `1px solid ${theme.fgc.feedback.warning}`, color: theme.fgc.chip.warningText}
            : dynamicChipTone === "counter_hit"
                ? {background: theme.fgc.highlight.surface, border: `1px solid ${theme.fgc.accent.warning}`, color: theme.fgc.text.secondary}
                : {background: theme.fgc.chip.neutralBg, border: `1px solid ${theme.fgc.chip.neutralBorder}`, color: theme.fgc.chip.neutralText};

    const displayValue = displayLabel ?? (valueFormatter ? valueFormatter(value) : value === null ? "" : String(value));

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
                        ? `2px solid ${theme.fgc.feedback.error}`
                        : isActive
                            ? `2px solid ${theme.fgc.selection.active}`
                            : `1px solid ${theme.fgc.border.default}`,
                    background: unavailable
                        ? theme.fgc.surface.sunken
                        : readOnly
                        ? theme.fgc.surface.sunken
                        : hasCommittedError
                            ? theme.fgc.chip.warningBg
                            : axisHighlighted
                                ? theme.fgc.selection.hover
                                : theme.fgc.surface.base,
                    color: unavailable ? theme.fgc.text.disabled : theme.fgc.text.primary,
                    cursor: "pointer",
                    borderRadius: 6,
                    fontVariantNumeric: "tabular-nums",
                    padding: dynamicChipLabels.length > 0 ? "4px" : undefined,
                    textAlign: "left",
                }}
            aria-label={unavailable ? "Unavailable cell" : readOnly ? "Read-only cell" : "Editable cell"}
            title={issues[0]?.message ?? (unavailable ? "Unavailable due to resource requirements" : undefined)}
        >
            {bodyCellKind === "reference" ? (
                <span style={{display: "grid", gap: 3}}>
                    <span
                        style={{
                            display: "inline-block",
                            width: "fit-content",
                            borderRadius: 999,
                            padding: "1px 6px",
                            fontSize: Math.max(10, densityProfile.valueFontSize - 2),
                            lineHeight: 1.3,
                            background: theme.fgc.chip.neutralBg,
                            border: `1px solid ${theme.fgc.chip.neutralBorder}`,
                            color: theme.fgc.chip.neutralText,
                        }}
                    >
                        Linked
                    </span>
                    <span style={{color: theme.fgc.text.primary}}>{displayValue}</span>
                </span>
            ) : dynamicChipLabels.length > 0 ? (
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
                    <span style={{fontSize: Math.max(10, densityProfile.valueFontSize - 1), color: theme.fgc.text.muted}}>
                        Current: {value === null ? "--" : value}
                    </span>
                </span>
            ) : displayValue}
        </button>
    );
}

export const MatrixValueCell = React.memo(MatrixValueCellComponent, (previous, next) => {
    const previousFirstIssue = previous.issues?.[0];
    const nextFirstIssue = next.issues?.[0];

    return (
        previous.value === next.value &&
        previous.valueFormatter === next.valueFormatter &&
        previous.displayLabel === next.displayLabel &&
        previous.bodyCellKind === next.bodyCellKind &&
        (previous.dynamicChipLabels?.join("|") ?? "") === (next.dynamicChipLabels?.join("|") ?? "") &&
        previous.dynamicChipTone === next.dynamicChipTone &&
        previous.isActive === next.isActive &&
        previous.isEditing === next.isEditing &&
        previous.draft === next.draft &&
        previous.draftHasFormatError === next.draftHasFormatError &&
        previous.axisHighlighted === next.axisHighlighted &&
        previous.unavailable === next.unavailable &&
        previous.readOnly === next.readOnly &&
        (previous.issues?.length ?? 0) === (next.issues?.length ?? 0) &&
        previousFirstIssue?.code === nextFirstIssue?.code &&
        previousFirstIssue?.message === nextFirstIssue?.message &&
        previous.densityProfile === next.densityProfile
    );
});
