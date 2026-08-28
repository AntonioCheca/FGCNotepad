import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTooltip} from "@/src/components/ui/AppTooltip";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {HelpOutlineOutlinedIcon} from "@/src/components/ui/AppIcons";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import type {ScenarioExecutionSelection} from "@/src/types/scenarioExecution";
import {getExecutionModeBadgeLabel} from "../scenarioDetailUtils";

interface ScenarioExecutionControlsProps {
    executionSelection: ScenarioExecutionSelection;
    isAuthenticated: boolean;
    theme: Theme;
    onExecutionSelectionChange: React.Dispatch<React.SetStateAction<ScenarioExecutionSelection>>;
}

export function ScenarioExecutionControls({executionSelection, isAuthenticated, theme, onExecutionSelectionChange}: ScenarioExecutionControlsProps) {
    return (
        <AppBox sx={{display: "flex", alignItems: "center", gap: {xs: 0.75, md: 1.2}, flexWrap: "wrap", p: {xs: 1, md: 1.2}, border: "1px solid", borderColor: theme.fgc.border.default, borderRadius: 1.5, backgroundColor: theme.fgc.surface.base, minWidth: 0}}>
            <AppBox sx={{display: "flex", alignItems: "center", gap: 0.5, minWidth: {xs: "100%", sm: "auto"}}}>
                <AppTypography variant="body2">Execution Mode</AppTypography>
                <AppTooltip title="Switch how dynamic combo values are calculated for this scenario view.">
                    <AppBox component="span" sx={{display: "inline-flex", cursor: "help"}}>
                        <HelpOutlineOutlinedIcon fontSize="small"/>
                    </AppBox>
                </AppTooltip>
            </AppBox>
            <AppFormControl size="small" sx={{minWidth: {xs: "100%", sm: 190}}}>
                <AppInputLabel id="scenario-execution-mode-label">Mode</AppInputLabel>
                <AppSelect<ScenarioExecutionSelection["mode"]>
                    labelId="scenario-execution-mode-label"
                    label="Mode"
                    value={executionSelection.mode}
                    onChange={(event) => {
                        const nextMode = event.target.value as ScenarioExecutionSelection["mode"];
                        if (nextMode === "my_knowledge" && !isAuthenticated) {
                            return;
                        }

                        onExecutionSelectionChange((current) => ({
                            mode: nextMode,
                            difficultyCap: nextMode === "difficulty_cap" ? current.difficultyCap ?? 3 : null,
                        }));
                    }}
                >
                    <AppMenuItem value="standard">Standard</AppMenuItem>
                    <AppMenuItem value="difficulty_cap">Difficulty Cap</AppMenuItem>
                    <AppMenuItem value="my_knowledge" disabled={!isAuthenticated}>My Knowledge</AppMenuItem>
                </AppSelect>
            </AppFormControl>

            {executionSelection.mode === "difficulty_cap" ? (
                <AppFormControl size="small" sx={{minWidth: {xs: "100%", sm: 150}}}>
                    <AppInputLabel id="scenario-max-difficulty-label">Max Difficulty</AppInputLabel>
                    <AppSelect<number>
                        labelId="scenario-max-difficulty-label"
                        label="Max Difficulty"
                        value={executionSelection.difficultyCap ?? 3}
                        onChange={(event) => {
                            const nextCap = Number.parseInt(String(event.target.value), 10);
                            onExecutionSelectionChange((current) => ({
                                ...current,
                                difficultyCap: Number.isFinite(nextCap) ? nextCap : 3,
                            }));
                        }}
                    >
                        {Array.from({length: 7}).map((_, index) => {
                            const level = index + 1;
                            return <AppMenuItem key={level} value={level}>{level}</AppMenuItem>;
                        })}
                    </AppSelect>
                </AppFormControl>
            ) : null}

            {!isAuthenticated ? <AppTypography variant="body2">Sign in to use My Knowledge mode.</AppTypography> : null}
            <AppChip size="small" color="primary" variant="outlined" label={getExecutionModeBadgeLabel(executionSelection)} />
        </AppBox>
    );
}
