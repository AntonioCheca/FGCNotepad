import React from "react";
import {useMode} from "@/src/context/ThemeContext";

import {MatrixDensityProfile} from "./gridDensity";
import styles from "./matrixEditorRendering.module.css";

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
    const controlFontSize = Math.max(12, densityProfile.labelFontSize - 2);
    const buttonHeight = Math.max(8, Math.floor(minHeight / 2));

    if (readOnly) {
        return (
            <button
                type="button"
                aria-label={`Select ${axisLabel} layer ${safeValue}`}
                onMouseDown={onSelect}
                onClick={onSelect}
                className={styles.matrixLayerBadgeReadOnly}
                style={{
                    "--layer-control-height": `${minHeight}px`,
                    "--layer-font-size": `${controlFontSize}px`,
                    "--layer-border": theme.fgc.border.default,
                    "--layer-readonly-background": theme.fgc.surface.subtle,
                    "--layer-readonly-color": theme.fgc.text.muted,
                } as React.CSSProperties}
            >
                {safeValue}
            </button>
        );
    }

    return (
        <div
            role="group"
            aria-label={`${axisLabel} layer control`}
            onMouseDown={onSelect}
            className={styles.matrixLayerGroup}
            style={{
                "--layer-border": theme.fgc.border.default,
                "--layer-background": theme.fgc.surface.base,
            } as React.CSSProperties}
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
                        fontSize: Math.max(12, controlFontSize - 1),
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
                        fontSize: Math.max(12, controlFontSize - 1),
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
