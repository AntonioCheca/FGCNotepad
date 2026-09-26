import React from "react";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppTextField} from "@/src/components/ui/AppTextField";

interface NeutralSelectFieldProps {
    id: string;
    label: string;
    options: Array<{value: string; label: string}>;
    value: string;
    onChange: (value: string) => void;
}

export function NeutralSelectField({id, label, options, value, onChange}: NeutralSelectFieldProps) {
    return (
        <AppTextField id={id} select size="small" fullWidth label={label} value={value} InputLabelProps={{shrink: true}} onChange={(event) => onChange(event.target.value)}>
            {options.map((option) => <AppMenuItem key={option.value} value={option.value}>{option.label}</AppMenuItem>)}
        </AppTextField>
    );
}
