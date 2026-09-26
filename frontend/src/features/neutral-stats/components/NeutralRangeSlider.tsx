import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppSlider} from "@/src/components/ui/AppSlider";
import {AppTypography} from "@/src/components/ui/AppTypography";

interface NeutralRangeSliderProps {
    label: string;
    min: number;
    max: number;
    step: number;
    value: [number, number];
    format?: (value: number) => string;
    onCommit: (value: [number, number]) => void;
}

/** Range slider that commits on release, so dragging does not fire one request per step. */
export function NeutralRangeSlider({label, min, max, step, value, format = String, onCommit}: NeutralRangeSliderProps) {
    const [draft, setDraft] = React.useState<[number, number]>(value);
    const [low, high] = value;

    React.useEffect(() => {
        setDraft([low, high]);
    }, [low, high]);

    return (
        <AppBox sx={{display: "grid", gap: 0.25, minWidth: 0, px: 0.5}}>
            <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1}}>
                <AppTypography variant="caption" color="text.secondary" sx={{fontWeight: 650}}>{label}</AppTypography>
                <AppTypography variant="caption" color="text.secondary">{format(draft[0])} – {format(draft[1])}</AppTypography>
            </AppBox>
            <AppSlider
                size="small"
                min={min}
                max={max}
                step={step}
                value={draft}
                disableSwap
                getAriaLabel={(index) => `${label} ${index === 0 ? "minimum" : "maximum"}`}
                getAriaValueText={(sliderValue) => format(sliderValue)}
                onChange={(_, next) => Array.isArray(next) && setDraft([next[0], next[1]])}
                onChangeCommitted={(_, next) => Array.isArray(next) && onCommit([next[0], next[1]])}
                sx={{py: 1.25}}
            />
        </AppBox>
    );
}
