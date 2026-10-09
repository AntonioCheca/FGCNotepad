import {AppBox} from "@/src/components/ui/AppBox";
import {AppToggleButton} from "@/src/components/ui/AppToggleButton";
import {AppToggleButtonGroup} from "@/src/components/ui/AppToggleButtonGroup";

export type TriStateValue = "" | "true" | "false";

const OPTIONS: Array<{value: TriStateValue; label: string}> = [
    {value: "", label: "Any"},
    {value: "true", label: "Yes"},
    {value: "false", label: "No"},
];

interface TriStateFilterProps {
    label: string;
    // Spelled-out name for screen readers when the visible label is an abbreviation.
    ariaLabel?: string;
    value: TriStateValue;
    onChange: (value: TriStateValue) => void;
}

export function TriStateFilter({label, ariaLabel, value, onChange}: TriStateFilterProps) {
    return (
        <AppBox sx={{display: "inline-flex", alignItems: "center", gap: 0.75, minWidth: 0}}>
            <AppBox component="span" aria-hidden sx={{typography: "body2", fontWeight: 700, whiteSpace: "nowrap"}}>{label}</AppBox>
            <AppToggleButtonGroup
                exclusive
                size="small"
                value={value}
                aria-label={ariaLabel ?? label}
                onChange={(_, next: TriStateValue | null) => {
                    if (next !== null) {
                        onChange(next);
                    }
                }}
            >
                {OPTIONS.map((option) => (
                    <AppToggleButton
                        key={option.label}
                        value={option.value}
                        sx={{
                            px: 1,
                            py: 0.25,
                            minHeight: {xs: 40, md: 32},
                            textTransform: "none",
                            fontWeight: 600,
                            "&.Mui-selected": {fontWeight: 800, backgroundColor: "fgc.selection.active", color: "text.primary"},
                        }}
                    >
                        {option.label}
                    </AppToggleButton>
                ))}
            </AppToggleButtonGroup>
        </AppBox>
    );
}
