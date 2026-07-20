import React from "react";

import {AppTypography} from "@/src/components/ui/AppTypography";
import type {ScenarioDetail} from "@/hooks/useScenarios";

interface ScenarioSummaryCardProps {
    scenario: ScenarioDetail;
}

export function ScenarioSummaryCard({scenario}: ScenarioSummaryCardProps) {
    return (
        <div style={{display: "grid", gap: 6, marginBottom: 16}}>
            <AppTypography variant="h6">{scenario.name}</AppTypography>
            <AppTypography variant="body2">Type: {scenario.typeLabel}</AppTypography>
            <AppTypography variant="body2">Defender: {scenario.defenderCharacterName ?? "Unknown"}</AppTypography>
            <AppTypography variant="body2">Attacker: {scenario.attackerCharacterName ?? "Unknown"}</AppTypography>
            <AppTypography variant="body2">Trigger Move: {scenario.triggerMoveLabel ?? "Unknown"}</AppTypography>
        </div>
    );
}
