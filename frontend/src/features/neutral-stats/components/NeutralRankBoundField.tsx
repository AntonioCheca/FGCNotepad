import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppTextField} from "@/src/components/ui/AppTextField";
import type {NeutralOption} from "@/src/types/neutralStats";

const EXACT_MR = "exact";
const MR_ENTRY_DEBOUNCE_MS = 400;

interface NeutralRankBoundFieldProps {
    id: string;
    label: string;
    options: NeutralOption[];
    unsetValue: string;
    unsetLabel: string;
    value: string;
    onChange: (token: string) => void;
}

/** Named League ranks and Master bands, plus an exact MR entry for Master-range bounds. */
export function NeutralRankBoundField({id, label, options, unsetValue, unsetLabel, value, onChange}: NeutralRankBoundFieldProps) {
    const isNamed = value === unsetValue || options.some((option) => option.value === value);
    const [pickedExact, setPickedExact] = React.useState(false);
    const [draft, setDraft] = React.useState<string | null>(null);
    const exactMode = pickedExact || !isNamed;
    const rating = draft ?? (value.startsWith("mr:") ? value.slice(3) : "");

    React.useEffect(() => {
        if (draft === null || !/^\d{1,4}$/.test(draft) || `mr:${Number(draft)}` === value) {
            return;
        }
        const timer = window.setTimeout(() => onChange(`mr:${Number(draft)}`), MR_ENTRY_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [draft, value, onChange]);

    return (
        <AppBox sx={{display: "grid", gridTemplateColumns: exactMode ? "minmax(0, 1fr) 92px" : "minmax(0, 1fr)", gap: 0.75, minWidth: 0}}>
            <AppTextField
                id={id}
                select
                size="small"
                fullWidth
                label={label}
                value={exactMode ? EXACT_MR : value}
                InputLabelProps={{shrink: true}}
                SelectProps={{displayEmpty: true, MenuProps: {PaperProps: {sx: {maxHeight: 360}}}}}
                onChange={(event) => {
                    setDraft(null);
                    if (event.target.value === EXACT_MR) {
                        setPickedExact(true);
                        return;
                    }
                    setPickedExact(false);
                    onChange(event.target.value);
                }}
            >
                <AppMenuItem value={unsetValue}>{unsetLabel}</AppMenuItem>
                {options.map((option) => <AppMenuItem key={option.value} value={option.value}>{option.label}</AppMenuItem>)}
                <AppMenuItem value={EXACT_MR}>Exact MR…</AppMenuItem>
            </AppTextField>
            {exactMode ? (
                <AppTextField
                    size="small"
                    label="MR"
                    value={rating}
                    onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputProps={{inputMode: "numeric", "aria-label": `${label} MR`}}
                    InputLabelProps={{shrink: true}}
                />
            ) : null}
        </AppBox>
    );
}
