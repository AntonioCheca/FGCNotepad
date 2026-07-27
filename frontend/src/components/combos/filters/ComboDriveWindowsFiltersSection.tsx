import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppSlider} from "@/src/components/ui/AppSlider";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {ComboDriveWindowFilters, ComboDriveWindowMetric} from "./comboFilterTypes";

const driveWindowOptions: Array<{metric: ComboDriveWindowMetric; label: string}> = [
    {metric: "driveCost", label: "Drive cost"},
    {metric: "minimumDriveCost", label: "Minimum drive"},
    {metric: "minimumDriveCostNoBurnout", label: "No-burnout minimum"},
];

interface ComboDriveWindowsFiltersSectionProps {
    driveWindows: ComboDriveWindowFilters;
    onAddDriveWindow: (metric: ComboDriveWindowMetric) => void;
    onRemoveDriveWindow: (metric: ComboDriveWindowMetric) => void;
    onDriveWindowRangeChange: (metric: ComboDriveWindowMetric, min?: string, max?: string) => void;
}

export function ComboDriveWindowsFiltersSection({driveWindows, onAddDriveWindow, onRemoveDriveWindow, onDriveWindowRangeChange}: ComboDriveWindowsFiltersSectionProps) {
    const availableOptions = driveWindowOptions.filter(({metric}) => !driveWindows[metric].enabled);
    const activeOptions = driveWindowOptions.filter(({metric}) => driveWindows[metric].enabled);
    const [selectedMetric, setSelectedMetric] = React.useState<ComboDriveWindowMetric>(availableOptions[0]?.metric ?? "driveCost");
    const effectiveSelectedMetric = availableOptions.some(({metric}) => metric === selectedMetric)
        ? selectedMetric
        : availableOptions[0]?.metric ?? "driveCost";

    return (
        <SectionCard title="Drive Windows" tone="default" variant="review">
            <AppBox sx={{display: "grid", gap: 1}}>
                {availableOptions.length > 0 ? (
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "minmax(210px, 280px) auto"}, gap: 1, alignItems: "center", justifyContent: "start"}}>
                        <AppFormControl size="small" sx={{minWidth: {xs: "100%", sm: 240}}}>
                            <AppInputLabel id="combo-drive-window-select-label">Metric</AppInputLabel>
                            <AppSelect<ComboDriveWindowMetric>
                                labelId="combo-drive-window-select-label"
                                label="Metric"
                                value={effectiveSelectedMetric}
                                onChange={(event) => setSelectedMetric(event.target.value as ComboDriveWindowMetric)}
                            >
                                {availableOptions.map(({metric, label}) => <AppMenuItem key={metric} value={metric}>{label}</AppMenuItem>)}
                            </AppSelect>
                        </AppFormControl>
                        <AppButton type="button" variant="outlined" color="secondary" onClick={() => onAddDriveWindow(effectiveSelectedMetric)} sx={{justifySelf: {xs: "stretch", sm: "start"}}}>
                            Add drive window
                        </AppButton>
                    </AppBox>
                ) : null}

                {activeOptions.map(({metric, label}) => (
                    <DriveWindowRow
                        key={metric}
                        metric={metric}
                        label={label}
                        min={driveWindows[metric].min}
                        max={driveWindows[metric].max}
                        onRangeChange={onDriveWindowRangeChange}
                        onRemove={onRemoveDriveWindow}
                    />
                ))}
            </AppBox>
        </SectionCard>
    );
}

interface DriveWindowRowProps {
    metric: ComboDriveWindowMetric;
    label: string;
    min: string;
    max: string;
    onRangeChange: (metric: ComboDriveWindowMetric, min?: string, max?: string) => void;
    onRemove: (metric: ComboDriveWindowMetric) => void;
}

function DriveWindowRow({metric, label, min, max, onRangeChange, onRemove}: DriveWindowRowProps) {
    const sliderValue = [readSliderValue(min, 0), readSliderValue(max, 6)] as [number, number];

    return (
        <AppBox
            sx={{
                display: "grid",
                gridTemplateColumns: {xs: "1fr", md: "minmax(150px, 190px) minmax(180px, 1fr) 76px 76px auto"},
                gap: 1,
                alignItems: "center",
                p: 1,
                border: 1,
                borderColor: "fgc.border.default",
                borderRadius: 2,
                backgroundColor: "fgc.surface.sunken",
            }}
        >
            <AppTypography variant="body2" sx={{fontWeight: 750}}>{label}</AppTypography>
            <AppSlider
                value={sliderValue}
                min={0}
                max={6}
                step={0.1}
                disableSwap
                onChange={(_, nextValue) => {
                    if (Array.isArray(nextValue)) {
                        onRangeChange(metric, formatDriveValue(nextValue[0] ?? 0), formatDriveValue(nextValue[1] ?? 6));
                    }
                }}
                valueLabelDisplay="auto"
                aria-label={`${label} range`}
                sx={(theme) => ({
                    color: theme.fgc.accent.primary,
                    px: {xs: 0.5, md: 0},
                    "&& .MuiSlider-thumb": {
                        backgroundColor: theme.fgc.accent.parser,
                        color: theme.fgc.accent.parser,
                        border: "2px solid",
                        borderColor: theme.fgc.surface.base,
                        "&:hover, &.Mui-focusVisible": {
                            boxShadow: `0 0 0 8px ${theme.fgc.highlight.surface}`,
                        },
                        "&.Mui-active": {
                            boxShadow: `0 0 0 12px ${theme.fgc.highlight.surface}`,
                        },
                    },
                    "&& .MuiSlider-rail": {
                        opacity: 1,
                        backgroundColor: theme.fgc.accent.selected,
                    },
                    "&& .MuiSlider-track": {
                        border: "none",
                        backgroundColor: theme.fgc.accent.primary,
                    },
                })}
            />
            <AppTextField label="Min" type="number" size="small" value={min} inputProps={{min: 0, max: 6, step: 0.1}} onChange={(event) => onRangeChange(metric, event.target.value, undefined)} />
            <AppTextField label="Max" type="number" size="small" value={max} inputProps={{min: 0, max: 6, step: 0.1}} onChange={(event) => onRangeChange(metric, undefined, event.target.value)} />
            <AppButton type="button" variant="text" color="secondary" onClick={() => onRemove(metric)} sx={{justifySelf: {xs: "stretch", md: "end"}}}>
                Remove
            </AppButton>
        </AppBox>
    );
}

function readSliderValue(value: string, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.min(6, Math.max(0, parsed));
}

function formatDriveValue(value: number): string {
    return value.toFixed(1).replace(/\.0$/, "");
}
