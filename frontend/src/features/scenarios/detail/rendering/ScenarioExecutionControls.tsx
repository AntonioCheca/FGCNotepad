import React from "react";

import {AppChip} from "@/src/components/ui/AppChip";
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
    const selectStyle = {height: 36, borderRadius: 6, border: `1px solid ${theme.fgc.border.default}`, background: theme.fgc.control.default, color: theme.fgc.text.primary, padding: "0 10px"};

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 16,
                border: `1px solid ${theme.fgc.border.default}`,
                borderRadius: 8,
                padding: 10,
                background: theme.fgc.surface.base,
            }}
        >
            <AppTypography variant="body2">Execution Mode</AppTypography>
            <AppTooltip title="Switch how dynamic combo values are calculated for this scenario view.">
                <span style={{display: "inline-flex", cursor: "help"}}>
                    <HelpOutlineOutlinedIcon fontSize="small"/>
                </span>
            </AppTooltip>
            <select
                aria-label="Execution mode"
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
                style={selectStyle}
            >
                <option value="standard">Standard</option>
                <option value="difficulty_cap">Difficulty Cap</option>
                <option value="my_knowledge" disabled={!isAuthenticated}>My Knowledge</option>
            </select>

            {executionSelection.mode === "difficulty_cap" ? (
                <>
                    <AppTypography variant="body2">Max Difficulty</AppTypography>
                    <select
                        aria-label="Max difficulty"
                        value={executionSelection.difficultyCap ?? 3}
                        onChange={(event) => {
                            const nextCap = Number.parseInt(event.target.value, 10);
                            onExecutionSelectionChange((current) => ({
                                ...current,
                                difficultyCap: Number.isFinite(nextCap) ? nextCap : 3,
                            }));
                        }}
                        style={selectStyle}
                    >
                        {Array.from({length: 7}).map((_, index) => {
                            const level = index + 1;
                            return <option key={level} value={level}>{level}</option>;
                        })}
                    </select>
                </>
            ) : null}

            {!isAuthenticated ? <AppTypography variant="body2">Sign in to use My Knowledge mode.</AppTypography> : null}
            <AppChip size="small" color="primary" variant="outlined" label={getExecutionModeBadgeLabel(executionSelection)} />
        </div>
    );
}
