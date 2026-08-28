import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppCheckbox} from "@/src/components/ui/AppCheckbox";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppFormControlLabel} from "@/src/components/ui/AppFormControlLabel";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {ScenarioDetail} from "@/hooks/useScenarios";
import type {Theme} from "@/src/components/ui/AppThemeUtils";

interface ScenarioComboEnvironmentCardProps {
    scenario: ScenarioDetail;
    includeCornerSpecific: boolean;
    onIncludeCornerSpecificChange: (value: boolean) => void;
    theme: Theme;
}

export function ScenarioComboEnvironmentCard({scenario, includeCornerSpecific, onIncludeCornerSpecificChange, theme}: ScenarioComboEnvironmentCardProps) {
    return (
        <AppBox sx={{display: "grid", gap: {xs: 0.75, md: 1}, p: {xs: 1, md: 1.2}, border: "1px solid", borderColor: theme.fgc.border.default, borderRadius: 1.5, backgroundColor: theme.fgc.surface.base, minWidth: 0}}>
            <AppTypography variant="h6">Combo Environment</AppTypography>
            {scenario.comboContext.positionLock === "corner" ? (
                <AppChip size="small" label="Position locked: Corner" />
            ) : scenario.comboContext.positionLock === "midscreen" ? (
                <AppChip size="small" label="Position locked: Midscreen" />
            ) : (
                <AppFormControlLabel
                    control={<AppCheckbox checked={includeCornerSpecific} onChange={(event) => onIncludeCornerSpecificChange(event.target.checked)} />}
                    label="Include corner-specific combos"
                    sx={{m: 0, color: theme.fgc.text.primary}}
                />
            )}
            {scenario.comboContext.characterStatuses.length > 0 ? (
                <AppBox sx={{display: "flex", gap: 0.6, flexWrap: "wrap", minWidth: 0}}>
                    {scenario.comboContext.characterStatuses.map((status) => (
                        <AppChip key={status.object_name} size="small" variant="outlined" label={`${status.object_name}: ${String(status.status_required)}`} />
                    ))}
                </AppBox>
            ) : (
                <AppTypography variant="body2" color="text.secondary">No character status locks.</AppTypography>
            )}
        </AppBox>
    );
}
