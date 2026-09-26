import React from "react";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {NeutralDistributionSeries, NeutralMoveFamily} from "@/src/types/neutralStats";

const FAMILY_LABELS: Record<NeutralMoveFamily, string> = {
    light: "Light",
    medium: "Medium",
    heavy: "Heavy",
    drive_rush: "Drive Rush",
    special: "Special",
    misc: "Misc",
    other: "Other",
};

interface NeutralDistributionLegendProps {
    series: NeutralDistributionSeries[];
    colors: Record<string, string>;
    swatchOpacity: number;
    hidden: ReadonlySet<string>;
    onToggle: (key: string) => void;
    onShowAll: () => void;
}

const formatShare = (share: number): string => `${share < 10 ? share.toFixed(1) : Math.round(share)}%`;

function LegendToggle({entry, color, swatchOpacity, visible, onToggle}: {
    entry: NeutralDistributionSeries;
    color: string;
    swatchOpacity: number;
    visible: boolean;
    onToggle: () => void;
}) {
    return (
        <AppBox
            component="button"
            aria-pressed={visible}
            aria-label={`${entry.label}, ${formatShare(entry.share)} of neutral observations`}
            onClick={onToggle}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                minWidth: 0,
                minHeight: 40,
                width: "100%",
                px: 0.75,
                border: "1px solid",
                borderColor: (theme: Theme) => (visible ? theme.fgc.border.subtle : "transparent"),
                borderRadius: 1,
                backgroundColor: (theme: Theme) => (visible ? theme.fgc.surface.subtle : "transparent"),
                color: "inherit",
                font: "inherit",
                textAlign: "left",
                cursor: "pointer",
                "&:hover": {backgroundColor: (theme: Theme) => theme.fgc.selection.hover},
                "&:focus-visible": {outline: (theme: Theme) => `2px solid ${theme.fgc.focus.outline}`, outlineOffset: 1},
            }}
        >
            <AppBox
                component="span"
                aria-hidden
                sx={{width: 14, height: 14, borderRadius: "3px", boxSizing: "border-box", border: "2px solid", borderColor: color, backgroundColor: visible ? color : "transparent", opacity: swatchOpacity, flexShrink: 0}}
            />
            <AppTypography
                variant="body2"
                color={visible ? "text.primary" : "text.disabled"}
                sx={{flex: 1, minWidth: 0, fontWeight: 600, overflowWrap: "anywhere", textDecoration: visible ? "none" : "line-through"}}
            >
                {entry.label}
            </AppTypography>
            <AppTypography variant="body2" color={visible ? "text.secondary" : "text.disabled"} sx={{flexShrink: 0, fontVariantNumeric: "tabular-nums"}}>
                {formatShare(entry.share)}
            </AppTypography>
        </AppBox>
    );
}

/**
 * Move legend grouped by family in the fixed family order; within a family, moves come most used first (the
 * backend's series order, which also sets the shade order). Each move toggles its segments.
 */
export function NeutralDistributionLegend({series, colors, swatchOpacity, hidden, onToggle, onShowAll}: NeutralDistributionLegendProps) {
    const anyHidden = series.some((entry) => hidden.has(entry.key));
    const families = series.reduce<Array<{family: NeutralMoveFamily; entries: NeutralDistributionSeries[]}>>((groups, entry) => {
        const last = groups[groups.length - 1];
        if (last && last.family === entry.family) {
            last.entries.push(entry);
        } else {
            groups.push({family: entry.family, entries: [entry]});
        }

        return groups;
    }, []);

    return (
        <AppBox sx={{display: "grid", gap: 1.25, minWidth: 0}}>
            <AppBox
                component="ul"
                aria-label="Legend: toggle moves shown in the chart"
                sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr)",
                    alignContent: "start",
                    gap: {xs: 1.5, lg: 1.75},
                    m: 0,
                    p: 0,
                    listStyle: "none",
                    minWidth: 0,
                }}
            >
                {families.map(({family, entries}) => (
                    <AppBox component="li" key={family} sx={{display: "grid", gap: 0.75, minWidth: 0}}>
                        {family === "other" ? null : (
                            <AppTypography variant="body2" sx={{fontWeight: 700}}>{FAMILY_LABELS[family]}</AppTypography>
                        )}
                        <AppBox
                            component="ul"
                            sx={{display: "grid", gridTemplateColumns: {xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))"}, gap: 0.75, m: 0, p: 0, listStyle: "none"}}
                        >
                            {entries.map((entry) => (
                                <AppBox component="li" key={entry.key} sx={{minWidth: 0}}>
                                    <LegendToggle
                                        entry={entry}
                                        color={colors[entry.key]}
                                        swatchOpacity={swatchOpacity}
                                        visible={!hidden.has(entry.key)}
                                        onToggle={() => onToggle(entry.key)}
                                    />
                                </AppBox>
                            ))}
                        </AppBox>
                    </AppBox>
                ))}
            </AppBox>
            {anyHidden ? (
                <AppButton type="button" size="small" variant="text" color="secondary" onClick={onShowAll} sx={{justifySelf: "start", minHeight: 32, px: 0.5}}>
                    Show all
                </AppButton>
            ) : null}
        </AppBox>
    );
}
