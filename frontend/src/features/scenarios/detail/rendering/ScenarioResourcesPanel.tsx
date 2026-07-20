import React from "react";

import {AppSlider} from "@/src/components/ui/AppSlider";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import type {ScenarioResourceContextPayload} from "@/hooks/useScenarios";

interface ScenarioResourcesPanelProps {
    scenarioResources: ScenarioResourceContextPayload;
    attackerLifeMax: number;
    defenderLifeMax: number;
    dynamicRefreshQueued: boolean;
    refreshingDynamicCombos: boolean;
    theme: Theme;
    onScenarioResourcesChange: React.Dispatch<React.SetStateAction<ScenarioResourceContextPayload>>;
}

export function ScenarioResourcesPanel({
    scenarioResources,
    attackerLifeMax,
    defenderLifeMax,
    dynamicRefreshQueued,
    refreshingDynamicCombos,
    theme,
    onScenarioResourcesChange,
}: ScenarioResourcesPanelProps) {
    return (
        <div
            style={{
                display: "grid",
                gap: 12,
                marginBottom: 16,
                border: `1px solid ${theme.fgc.border.default}`,
                borderRadius: 8,
                padding: 12,
                background: theme.fgc.surface.base,
            }}
        >
            <AppTypography variant="h6">Resources</AppTypography>
            <AppTypography variant="body2" color="text.secondary">
                Resource changes update option availability immediately. Dynamic combos refresh automatically after 1 second of no slider input.
                {dynamicRefreshQueued ? " Refresh queued..." : refreshingDynamicCombos ? " Refreshing dynamic combos..." : ""}
            </AppTypography>
            <div style={{display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"}}>
                {([
                    {key: "attacker", label: "Attacker Resources", lifeMax: attackerLifeMax},
                    {key: "defender", label: "Defender Resources", lifeMax: defenderLifeMax},
                ] as const).map((player) => {
                    const values = scenarioResources[player.key];
                    return (
                        <div
                            key={player.key}
                            style={{
                                border: `1px solid ${theme.fgc.border.default}`,
                                borderRadius: 8,
                                padding: 12,
                                display: "grid",
                                gap: 10,
                                background: theme.fgc.surface.subtle,
                                minWidth: 0,
                            }}
                        >
                            <AppTypography variant="body1" sx={{fontWeight: 700}}>{player.label}</AppTypography>
                            <ScenarioResourceSlider
                                label="Health"
                                value={values.health}
                                displayValue={`${values.health} / ${player.lifeMax}`}
                                min={0}
                                max={player.lifeMax}
                                step={100}
                                color={theme.fgc.action.primary}
                                railColor={theme.fgc.surface.sunken}
                                ariaLabel={`${player.label} health`}
                                onChange={(nextValue) => onScenarioResourcesChange((current) => ({
                                    ...current,
                                    [player.key]: {
                                        ...current[player.key],
                                        health: Math.min(nextValue, player.lifeMax),
                                    },
                                }))}
                            />
                            <ScenarioResourceSlider
                                label="Drive"
                                value={values.drive}
                                displayValue={values.drive.toFixed(1)}
                                min={0}
                                max={6}
                                step={0.5}
                                color={theme.fgc.action.secondary}
                                railColor={theme.fgc.surface.sunken}
                                ariaLabel={`${player.label} drive`}
                                onChange={(nextValue) => onScenarioResourcesChange((current) => ({
                                    ...current,
                                    [player.key]: {
                                        ...current[player.key],
                                        drive: nextValue,
                                    },
                                }))}
                            />
                            <ScenarioResourceSlider
                                label="Super"
                                value={values.super}
                                displayValue={String(values.super)}
                                min={0}
                                max={3}
                                step={1}
                                marks
                                color={theme.fgc.action.primaryHover}
                                railColor={theme.fgc.surface.sunken}
                                ariaLabel={`${player.label} super`}
                                onChange={(nextValue) => onScenarioResourcesChange((current) => ({
                                    ...current,
                                    [player.key]: {
                                        ...current[player.key],
                                        super: nextValue,
                                    },
                                }))}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface ScenarioResourceSliderProps {
    label: string;
    value: number;
    displayValue: string;
    min: number;
    max: number;
    step: number;
    marks?: boolean;
    color: string;
    railColor: string;
    ariaLabel: string;
    onChange: (value: number) => void;
}

function ScenarioResourceSlider({label, value, displayValue, min, max, step, marks, color, railColor, ariaLabel, onChange}: ScenarioResourceSliderProps) {
    return (
        <div style={{display: "grid", gap: 4}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8}}>
                <AppTypography variant="body2">{label}</AppTypography>
                <AppTypography variant="body2">{displayValue}</AppTypography>
            </div>
            <AppSlider
                value={value}
                min={min}
                max={max}
                step={step}
                marks={marks}
                onChange={(_, nextValue) => onChange(typeof nextValue === "number" ? nextValue : value)}
                sx={{
                    color,
                    "& .MuiSlider-rail": {opacity: 1, backgroundColor: railColor},
                    "& .MuiSlider-track": {border: "none"},
                }}
                aria-label={ariaLabel}
            />
        </div>
    );
}
