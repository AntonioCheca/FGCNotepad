import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {NeutralResourceOption, NeutralResourceSelection, NeutralSideGauges} from "@/src/types/neutralStats";
import {NeutralMultiSelectField} from "./NeutralMultiSelectField";
import {NeutralRangeSlider} from "./NeutralRangeSlider";

interface NeutralSideStateFiltersProps {
    id: string;
    title: string;
    maxHealth: number;
    driveBars: number;
    superBars: number;
    gauges: NeutralSideGauges;
    resources: NeutralResourceOption[];
    selection: NeutralResourceSelection;
    onGaugesChange: (gauges: NeutralSideGauges) => void;
    onSelectionChange: (selection: NeutralResourceSelection) => void;
}

const formatHealth = (value: number): string => value.toLocaleString();

/** Frame-state filters of one side: Drive, Super, Health ranges and the character's own resources. */
export function NeutralSideStateFilters({id, title, maxHealth, driveBars, superBars, gauges, resources, selection, onGaugesChange, onSelectionChange}: NeutralSideStateFiltersProps) {
    const health = gauges.health ?? {min: 0, max: maxHealth};

    return (
        <AppBox sx={{display: "grid", gap: 0.75, minWidth: 0}}>
            <AppTypography variant="overline" color="text.secondary" sx={{lineHeight: 1.6}}>{title}</AppTypography>
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "repeat(3, minmax(0, 1fr))"}, gap: {xs: 0.5, sm: 2}}}>
                <NeutralRangeSlider
                    label="Drive"
                    min={0}
                    max={driveBars}
                    step={0.5}
                    value={[gauges.drive.min, gauges.drive.max]}
                    onCommit={([min, max]) => onGaugesChange({...gauges, drive: {min, max}})}
                />
                <NeutralRangeSlider
                    label="Super"
                    min={0}
                    max={superBars}
                    step={0.5}
                    value={[gauges.super.min, gauges.super.max]}
                    onCommit={([min, max]) => onGaugesChange({...gauges, super: {min, max}})}
                />
                <NeutralRangeSlider
                    label="Health"
                    min={0}
                    max={maxHealth}
                    step={100}
                    value={[Math.min(health.min, maxHealth), Math.min(health.max, maxHealth)]}
                    format={formatHealth}
                    onCommit={([min, max]) => onGaugesChange({...gauges, health: min === 0 && max >= maxHealth ? null : {min, max}})}
                />
            </AppBox>
            {resources.length > 0 ? (
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "repeat(auto-fill, minmax(180px, 240px))"}, gap: 1}}>
                    {resources.map((resource) => (
                        <NeutralMultiSelectField
                            key={resource.key}
                            id={`${id}-${resource.key}`}
                            label={resource.label}
                            emptyLabel="Any"
                            options={resource.values.map((entry) => ({value: String(entry.value), label: entry.label}))}
                            selected={(selection[resource.key] ?? []).map(String)}
                            onChange={(values) => {
                                const next = {...selection};
                                if (values.length === 0) {
                                    delete next[resource.key];
                                } else {
                                    next[resource.key] = values.map(Number);
                                }
                                onSelectionChange(next);
                            }}
                        />
                    ))}
                </AppBox>
            ) : null}
        </AppBox>
    );
}
