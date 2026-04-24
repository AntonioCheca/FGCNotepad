import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";

interface ToggleRowProps {
    label: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}

export function ToggleRow({label, checked, disabled, onChange}: ToggleRowProps) {
    return (
        <AppBox
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                px: 1,
                py: 0.25,
                backgroundColor: (theme) => (checked ? theme.fgc.surface.selected : "transparent"),
            }}
        >
            <AppTypography variant="body2" color="text.primary">{label}</AppTypography>
            <AppFormControlLabel
                label=""
                sx={{mr: 0}}
                control={
                    <AppCheckbox
                        checked={checked}
                        disabled={disabled}
                        onChange={(event) => onChange(event.target.checked)}
                        inputProps={{"aria-label": label}}
                    />
                }
            />
        </AppBox>
    );
}
