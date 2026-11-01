import React from "react";
import {useMode} from "@/src/context/ThemeContext";

export function ExpectedValueKpi({expectedValue}: {expectedValue: number | null}) {
    const {theme} = useMode();
    const rounded = expectedValue === null ? null : Math.round(expectedValue);

    return (
        <div style={{border: `1px solid ${theme.fgc.border.default}`, borderRadius: 10, padding: 10, background: theme.fgc.surface.raised}}>
            <div style={{fontSize: 14, fontWeight: 700, color: theme.fgc.text.secondary}}>Expected Value</div>
            <div
                style={{
                    fontSize: 30,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: rounded === null ? theme.fgc.text.secondary : rounded >= 0 ? theme.fgc.feedback.success : theme.fgc.feedback.errorText,
                }}
            >
                {rounded === null ? "--" : `${rounded > 0 ? "+" : ""}${rounded}`}
            </div>
        </div>
    );
}
