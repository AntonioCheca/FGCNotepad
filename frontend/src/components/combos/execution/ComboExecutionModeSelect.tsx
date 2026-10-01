import React from "react";

import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {COMBO_EXECUTION_MODE_OPTIONS, ComboExecutionMode, isComboExecutionMode} from "@/src/types/comboExecution";

interface ComboExecutionModeSelectProps {
    value: ComboExecutionMode;
    onChange: (mode: ComboExecutionMode) => void;
    disabled?: boolean;
}

export function ComboExecutionModeSelect({value, onChange, disabled = false}: ComboExecutionModeSelectProps) {
    const labelId = React.useId();

    return (
        <AppFormControl size="small" sx={{minWidth: {xs: "100%", sm: 220}}}>
            <AppInputLabel id={labelId}>Controls</AppInputLabel>
            <AppSelect<ComboExecutionMode>
                labelId={labelId}
                label="Controls"
                value={value}
                disabled={disabled}
                onChange={(event) => {
                    if (isComboExecutionMode(event.target.value)) {
                        onChange(event.target.value);
                    }
                }}
            >
                {COMBO_EXECUTION_MODE_OPTIONS.map((option) => (
                    <AppMenuItem key={option.value} value={option.value}>{option.label}</AppMenuItem>
                ))}
            </AppSelect>
        </AppFormControl>
    );
}
