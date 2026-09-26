import React from "react";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppListItemText} from "@/src/components/ui/AppListItemText";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppTextField} from "@/src/components/ui/AppTextField";

interface NeutralMultiSelectFieldProps {
    id: string;
    label: string;
    options: Array<{value: string; label: string}>;
    selected: string[];
    emptyLabel: string;
    onChange: (selected: string[]) => void;
}

/** Multi-select where nothing selected means "all"; the closed field shows a plain text summary instead of chips. */
export function NeutralMultiSelectField({id, label, options, selected, emptyLabel, onChange}: NeutralMultiSelectFieldProps) {
    const selectedSet = new Set(selected);
    const labels = new Map(options.map((option) => [option.value, option.label]));

    return (
        <AppTextField
            id={id}
            select
            size="small"
            fullWidth
            label={label}
            value={selected}
            InputLabelProps={{shrink: true}}
            SelectProps={{
                multiple: true,
                displayEmpty: true,
                renderValue: (values) => {
                    const chosen = new Set(values as string[]);

                    return chosen.size === 0 ? emptyLabel : options.flatMap((option) => (chosen.has(option.value) ? [option.label] : [])).join(", ");
                },
            }}
            onChange={(event) => {
                const value = event.target.value as unknown as string[] | string;
                const next = new Set(typeof value === "string" ? value.split(",") : value);
                onChange([...labels.keys()].filter((optionValue) => next.has(optionValue)));
            }}
        >
            {options.map((option) => (
                <AppMenuItem key={option.value} value={option.value} dense>
                    <AppCheckbox size="small" checked={selectedSet.has(option.value)} sx={{p: 0.5, mr: 0.75}}/>
                    <AppListItemText primary={option.label}/>
                </AppMenuItem>
            ))}
        </AppTextField>
    );
}
