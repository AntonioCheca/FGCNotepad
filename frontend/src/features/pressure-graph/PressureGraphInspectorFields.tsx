import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppDialog} from "@/src/components/ui/AppDialog";
import {AppDialogContent} from "@/src/components/ui/AppDialogContent";
import {AppDialogTitle} from "@/src/components/ui/AppDialogTitle";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppToggleButton} from "@/src/components/ui/AppToggleButton";
import {AppToggleButtonGroup} from "@/src/components/ui/AppToggleButtonGroup";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {PRESSURE_EDGE_KIND_LABELS, PRESSURE_READ_LABEL_MAX_LENGTH} from "./pressureGraphTypes";
import type {PressureEdgeKind} from "./pressureGraphTypes";

// Building blocks the oki and blockstring inspectors share, so both editors look and behave the same.

export function PressureInspectorRow({children}: {children: React.ReactNode}) {
    return <AppBox sx={{display: "flex", flexWrap: "wrap", gap: 1.25, alignItems: "flex-end"}}>{children}</AppBox>;
}

export function PressureSegmented<T extends string>({label, value, options, onChange}: {label: string; value: T; options: Array<[T, string]>; onChange: (value: T) => void}) {
    return (
        <AppBox sx={{display: "grid", gap: 0.35, minWidth: 0}}>
            <AppTypography variant="caption" sx={{fontWeight: 800, color: "text.secondary"}}>{label}</AppTypography>
            <AppToggleButtonGroup
                exclusive
                size="small"
                aria-label={label}
                value={value}
                onChange={(_, next: T | null) => {
                    if (next !== null) {
                        onChange(next);
                    }
                }}
                sx={{flexWrap: "wrap"}}
            >
                {options.map(([optionValue, optionLabel]) => (
                    <AppToggleButton key={optionValue} value={optionValue} sx={{px: 1.1, py: 0.4, textTransform: "none", fontWeight: 700, minHeight: 36}}>{optionLabel}</AppToggleButton>
                ))}
            </AppToggleButtonGroup>
        </AppBox>
    );
}

interface PressureEdgeKindFieldsProps {
    kinds: PressureEdgeKind[];
    kind: PressureEdgeKind;
    readLabel: string;
    onChange: (patch: {kind?: PressureEdgeKind; readLabel?: string}) => void;
}

export function PressureEdgeKindFields({kinds, kind, readLabel, onChange}: PressureEdgeKindFieldsProps) {
    return (
        <>
            <PressureSegmented<PressureEdgeKind> label="Arrow" value={kind} options={kinds.map((option) => [option, PRESSURE_EDGE_KIND_LABELS[option]])} onChange={(next) => onChange({kind: next})} />
            {kind === "read" ? (
                <AppTextField size="small" margin="none" label="Read" placeholder="expects mash" value={readLabel} sx={{maxWidth: {md: 300}}} slotProps={{htmlInput: {maxLength: PRESSURE_READ_LABEL_MAX_LENGTH}}} onChange={(event) => onChange({readLabel: event.target.value})} />
            ) : null}
        </>
    );
}

export function PressureRemoveButton({label, onClick}: {label: string; onClick: () => void}) {
    return (
        <AppBox>
            <AppButton type="button" variant="text" color="error" size="small" onClick={onClick}>{label}</AppButton>
        </AppBox>
    );
}

// Opened by a node's "+": the picker inside creates the next node and its arrow in one step.
export function PressureAddNodeDialog({afterLabel, onClose, children}: {afterLabel: string | null; onClose: () => void; children: React.ReactNode}) {
    return (
        <AppDialog open={afterLabel !== null} fullWidth maxWidth="xs" onClose={onClose} slotProps={{paper: {sx: {alignSelf: "flex-start", mt: {xs: 6, sm: 12}}}}}>
            <AppDialogTitle sx={{pb: 1}}>After {afterLabel ?? ""}</AppDialogTitle>
            <AppDialogContent sx={{pt: "8px !important", pb: 2.5}}>{afterLabel !== null ? children : null}</AppDialogContent>
        </AppDialog>
    );
}
