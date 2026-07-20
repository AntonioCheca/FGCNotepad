import React from "react";

import {AppChip} from "@/src/components/ui/AppChip";
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
        <div
            style={{
                display: "grid",
                gap: 8,
                marginBottom: 16,
                border: `1px solid ${theme.fgc.border.default}`,
                borderRadius: 8,
                padding: 12,
                background: theme.fgc.surface.base,
            }}
        >
            <AppTypography variant="h6">Combo Environment</AppTypography>
            {scenario.comboContext.positionLock === "corner" ? (
                <AppChip size="small" label="Position locked: Corner" />
            ) : scenario.comboContext.positionLock === "midscreen" ? (
                <AppChip size="small" label="Position locked: Midscreen" />
            ) : (
                <label style={{display: "flex", alignItems: "center", gap: 8, color: theme.fgc.text.primary}}>
                    <input type="checkbox" checked={includeCornerSpecific} onChange={(event) => onIncludeCornerSpecificChange(event.target.checked)} />
                    <span>Include corner-specific combos</span>
                </label>
            )}
            {scenario.comboContext.characterStatuses.length > 0 ? (
                <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
                    {scenario.comboContext.characterStatuses.map((status) => (
                        <AppChip key={status.object_name} size="small" variant="outlined" label={`${status.object_name}: ${String(status.status_required)}`} />
                    ))}
                </div>
            ) : (
                <AppTypography variant="body2" color="text.secondary">No character status locks.</AppTypography>
            )}
        </div>
    );
}
