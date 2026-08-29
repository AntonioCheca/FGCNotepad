import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppSlider} from "@/src/components/ui/AppSlider";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import type {ScenarioDetail, ScenarioResourceContextPayload} from "@/hooks/useScenarios";

type ObjectDefinition = {object_key?: string; name: string; character_name?: string; display_name?: string; status_type: "integer" | "boolean"; max_status: number | null};

interface ScenarioResourcesPanelProps {
    scenarioResources: ScenarioResourceContextPayload;
    attackerLifeMax: number;
    defenderLifeMax: number;
    scenario: ScenarioDetail;
    objectDefinitions: ObjectDefinition[];
    dynamicRefreshQueued: boolean;
    refreshingDynamicCombos: boolean;
    theme: Theme;
    onScenarioResourcesChange: React.Dispatch<React.SetStateAction<ScenarioResourceContextPayload>>;
}

export function ScenarioResourcesPanel({
    scenarioResources,
    attackerLifeMax,
    defenderLifeMax,
    scenario,
    objectDefinitions,
    dynamicRefreshQueued,
    refreshingDynamicCombos,
    theme,
    onScenarioResourcesChange,
}: ScenarioResourcesPanelProps) {
    const refreshStatus = dynamicRefreshQueued ? "Refresh queued..." : refreshingDynamicCombos ? "Refreshing dynamic combos..." : null;

    return (
        <AppBox sx={{display: "grid", gap: {xs: 0.9, md: 1.2}, p: {xs: 1, md: 1.2}, border: "1px solid", borderColor: theme.fgc.border.default, borderRadius: 1.5, backgroundColor: theme.fgc.surface.base, minWidth: 0}}>
            <AppTypography variant="h6">Resources</AppTypography>
            <AppTypography variant="body2" color="text.secondary" sx={{display: {xs: refreshStatus ? "block" : "none", md: "block"}}}>
                <AppBox component="span" sx={{display: {xs: "none", md: "inline"}}}>Resource changes update option availability immediately. Dynamic combos refresh automatically after 1 second of no slider input.</AppBox>
                {refreshStatus ? ` ${refreshStatus}` : ""}
            </AppTypography>
            <AppBox sx={{display: "grid", gap: {xs: 0.8, md: 1.2}, gridTemplateColumns: {xs: "1fr", md: "repeat(auto-fit, minmax(280px, 1fr))"}}}>
                {([
                    {key: "attacker", label: `${scenario.attackerCharacterName ?? "Attacker"} Resources`, characterName: scenario.attackerCharacterName, lifeMax: attackerLifeMax},
                    {key: "defender", label: `${scenario.defenderCharacterName ?? "Defender"} Resources`, characterName: scenario.defenderCharacterName, lifeMax: defenderLifeMax},
                ] as const).map((player) => {
                    const values = scenarioResources[player.key];
                    const playerObjects = objectDefinitions.filter((definition) => player.characterName && definition.character_name?.toLowerCase() === player.characterName.toLowerCase());
                    return (
                        <AppBox
                            key={player.key}
                            sx={{border: "1px solid", borderColor: theme.fgc.border.default, borderRadius: 1.5, p: {xs: 0.9, md: 1.2}, display: "grid", gap: {xs: 0.75, md: 1}, backgroundColor: theme.fgc.surface.subtle, minWidth: 0}}
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
                            {playerObjects.length > 0 ? (
                                <AppBox sx={{display: "grid", gap: 0.65, pt: 0.35}}>
                                    <AppTypography variant="body2" color="text.secondary">Character objects</AppTypography>
                                    <AppBox sx={{display: "grid", gap: 0.7, gridTemplateColumns: {xs: "1fr", sm: "repeat(auto-fit, minmax(150px, 1fr))"}}}>
                                        {playerObjects.map((definition) => {
                                            const objectKey = definition.object_key ?? definition.name;
                                            const objectStatuses = values.objectStatuses ?? {};
                                            const currentValue = objectStatuses[objectKey] ?? "";

                                            return (
                                                <AppTextField
                                                    key={objectKey}
                                                    label={definition.name}
                                                    size="small"
                                                    type={definition.status_type === "integer" ? "number" : undefined}
                                                    value={String(currentValue)}
                                                    inputProps={definition.status_type === "integer" ? {min: 0, max: definition.max_status ?? undefined} : undefined}
                                                    placeholder={definition.status_type === "boolean" ? "true/false" : "0"}
                                                    onChange={(event) => {
                                                        const rawValue = event.target.value.trim();
                                                        onScenarioResourcesChange((current) => {
                                                            const nextObjectStatuses = {...(current[player.key].objectStatuses ?? {})};
                                                            if (rawValue === "" || rawValue === "0" || rawValue.toLowerCase() === "false") {
                                                                delete nextObjectStatuses[objectKey];
                                                            } else {
                                                                nextObjectStatuses[objectKey] = definition.status_type === "integer" ? Number.parseInt(rawValue, 10) || 0 : rawValue;
                                                            }

                                                            return {
                                                                ...current,
                                                                [player.key]: {
                                                                    ...current[player.key],
                                                                    objectStatuses: nextObjectStatuses,
                                                                },
                                                            };
                                                        });
                                                    }}
                                                />
                                            );
                                        })}
                                    </AppBox>
                                </AppBox>
                            ) : null}
                        </AppBox>
                    );
                })}
            </AppBox>
        </AppBox>
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
        <AppBox sx={{display: "grid", gap: 0.4}}>
            <AppBox sx={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1}}>
                <AppTypography variant="body2">{label}</AppTypography>
                <AppTypography variant="body2">{displayValue}</AppTypography>
            </AppBox>
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
        </AppBox>
    );
}
