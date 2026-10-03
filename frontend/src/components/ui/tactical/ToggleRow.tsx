import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";

interface ToggleRowProps {
    label: string;
    icon?: React.ReactNode;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}

export function ToggleRow({label, icon, checked, disabled, onChange}: ToggleRowProps) {
    return (
        <AppBox
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid",
                borderColor: checked ? "fgc.border.strong" : "divider",
                borderRadius: 1.5,
                px: 1,
                py: 0.35,
                backgroundColor: (theme) => (checked ? theme.fgc.surface.selected : theme.fgc.surface.sunken),
                transition: "border-color 0.2s ease, background-color 0.2s ease",
            }}
        >
            <AppBox sx={{display: "inline-flex", alignItems: "center", gap: 0.75, minWidth: 0}}>
                {icon}
                <AppTypography variant="body2" color="text.primary">{label}</AppTypography>
            </AppBox>
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
