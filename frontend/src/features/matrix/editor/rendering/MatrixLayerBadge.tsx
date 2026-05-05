import React from "react";
import {useMode} from "@/src/context/ThemeContext";

import {MatrixDensityProfile} from "./gridDensity";

interface MatrixLayerBadgeProps {
    value: number;
    readOnly: boolean;
    axisLabel: string;
    onSelect: () => void;
    onChange: (layer: number) => void;
    densityProfile: MatrixDensityProfile;
}

function clampLayer(value: number): number {
    if (!Number.isFinite(value)) {
        return 1;
    }

    return Math.max(1, Math.trunc(value));
}

export function MatrixLayerBadge({
    value,
    readOnly,
    axisLabel,
    onSelect,
    onChange,
    densityProfile,
}: MatrixLayerBadgeProps) {
    const {theme} = useMode();
    const safeValue = clampLayer(value);

    const decrease = React.useCallback(() => {
        onChange(Math.max(1, safeValue - 1));
    }, [onChange, safeValue]);

    const increase = React.useCallback(() => {
        onChange(safeValue + 1);
    }, [onChange, safeValue]);

    const minHeight = Math.max(18, densityProfile.cellHeight - 10);
    const controlFontSize = Math.max(10, densityProfile.labelFontSize - 2);
    const buttonHeight = Math.max(8, Math.floor(minHeight / 2));

    if (readOnly) {
        return (
            <span
                onMouseDown={onSelect}
                style={{
                    marginTop: 4,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight,
                    minWidth: 28,
                    padding: "0 6px",
                    borderRadius: 999,
                    border: `1px solid ${theme.fgc.border.default}`,
                    background: theme.fgc.surface.subtle,
                    color: theme.fgc.text.muted,
                    fontSize: controlFontSize,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                }}
            >
                {safeValue}
            </span>
        );
    }

    return (
        <div
            role="group"
            aria-label={`${axisLabel} layer control`}
            onMouseDown={onSelect}
            style={{
                marginTop: 4,
                display: "inline-flex",
                alignItems: "center",
                border: `1px solid ${theme.fgc.border.default}`,
                borderRadius: 8,
                overflow: "hidden",
                background: theme.fgc.surface.base,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
        >
            <button
                type="button"
                onFocus={onSelect}
                onClick={onSelect}
                onKeyDown={(event) => {
                    if (event.key === "ArrowUp" || event.key === "+") {
                        event.preventDefault();
                        increase();
                    } else if (event.key === "ArrowDown" || event.key === "-") {
                        event.preventDefault();
                        decrease();
                    }
                }}
                aria-label={`${axisLabel} layer ${safeValue}`}
                style={{
                    border: "none",
                    borderRight: `1px solid ${theme.fgc.border.subtle}`,
                    background: theme.fgc.surface.base,
                    color: theme.fgc.text.primary,
                    minHeight,
                    minWidth: safeValue >= 10 ? 24 : 18,
                    padding: "0 4px",
                    fontSize: controlFontSize,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                    cursor: "pointer",
                }}
            >
                {safeValue}
            </button>
            <span
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                }}
            >
                <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Increase ${axisLabel} layer`}
                    onClick={increase}
                    style={{
                        border: "none",
                        borderBottom: `1px solid ${theme.fgc.border.subtle}`,
                        background: theme.fgc.surface.subtle,
                        color: theme.fgc.text.muted,
                        height: buttonHeight,
                        width: 14,
                        cursor: "pointer",
                        fontSize: Math.max(9, controlFontSize - 1),
                        lineHeight: 1,
                        padding: 0,
                    }}
                >
                    +
                </button>
                <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Decrease ${axisLabel} layer`}
                    disabled={safeValue <= 1}
                    onClick={decrease}
                    style={{
                        border: "none",
                        background: safeValue <= 1 ? theme.fgc.surface.sunken : theme.fgc.surface.subtle,
                        color: safeValue <= 1 ? theme.fgc.text.disabled : theme.fgc.text.muted,
                        height: buttonHeight,
                        width: 14,
                        cursor: safeValue <= 1 ? "not-allowed" : "pointer",
                        fontSize: Math.max(9, controlFontSize - 1),
                        lineHeight: 1,
                        padding: 0,
                    }}
                >
                    -
                </button>
            </span>
        </div>
    );
}
