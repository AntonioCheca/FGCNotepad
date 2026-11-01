import React from "react";

import {useMode} from "@/src/context/ThemeContext";
import {estimateLabelLines} from "./matrix-grid/matrixGridSizing";

interface AxisLabelFieldProps {
    ariaLabel: string;
    value: string;
    readOnly: boolean;
    disabled: boolean;
    width: number;
    minHeight: number;
    fontSize: number;
    onFocus: () => void;
    onChange: (label: string) => void;
}

// A label that wraps onto extra lines once its column is at full width, instead of scrolling inside the field.
export function AxisLabelField({ariaLabel, value, readOnly, disabled, width, minHeight, fontSize, onFocus, onChange}: AxisLabelFieldProps) {
    const {theme} = useMode();

    return (
        <textarea
            aria-label={ariaLabel}
            value={value}
            readOnly={readOnly}
            rows={estimateLabelLines(value, fontSize, width)}
            onFocus={onFocus}
            onChange={(event) => onChange(event.target.value.replace(/\s*\n\s*/g, " "))}
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                }
            }}
            style={{
                display: "block",
                boxSizing: "border-box",
                width: `${width}px`,
                minHeight,
                fontFamily: "inherit",
                fontSize,
                lineHeight: 1.35,
                padding: "4px 6px",
                borderRadius: 6,
                border: `1px solid ${theme.fgc.border.default}`,
                background: theme.fgc.control.default,
                color: disabled ? theme.fgc.text.disabled : theme.fgc.text.primary,
                resize: "none",
                overflow: "hidden",
                overflowWrap: "anywhere",
            }}
        />
    );
}

