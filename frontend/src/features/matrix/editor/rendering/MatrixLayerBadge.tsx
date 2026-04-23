import React from "react";

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
                    border: "1px solid #d9d9d9",
                    background: "#fafafa",
                    color: "#595959",
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
                border: "1px solid #d9d9d9",
                borderRadius: 8,
                overflow: "hidden",
                background: "#fff",
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
                    borderRight: "1px solid #ededed",
                    background: "#fff",
                    color: "#262626",
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
                        borderBottom: "1px solid #ededed",
                        background: "#fafafa",
                        color: "#595959",
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
                        background: safeValue <= 1 ? "#f5f5f5" : "#fafafa",
                        color: safeValue <= 1 ? "#bfbfbf" : "#595959",
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
