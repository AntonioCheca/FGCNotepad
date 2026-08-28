import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {ScenarioDetail} from "@/hooks/useScenarios";

interface ScenarioSummaryCardProps {
    scenario: ScenarioDetail;
}

export function ScenarioSummaryCard({scenario}: ScenarioSummaryCardProps) {
    return (
        <AppBox sx={{display: "grid", gap: {xs: 0.75, md: 0.6}, p: {xs: 1, md: 1.2}, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1.5, backgroundColor: "fgc.surface.base", minWidth: 0}}>
            <AppBox sx={{display: "flex", gap: 0.75, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", minWidth: 0}}>
                <AppTypography variant="h6" sx={{fontWeight: 750, overflowWrap: "anywhere"}}>{scenario.name}</AppTypography>
                <AppChip size="small" variant="outlined" label={scenario.typeLabel} />
            </AppBox>
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr 1fr", md: "repeat(3, minmax(0, 1fr))"}, gap: {xs: 0.65, md: 0.8}}}>
                <ScenarioFact label="Defender" value={scenario.defenderCharacterName ?? "Unknown"} />
                <ScenarioFact label="Attacker" value={scenario.attackerCharacterName ?? "Unknown"} />
                <ScenarioFact label="Trigger" value={scenario.triggerMoveLabel ?? "Unknown"} />
            </AppBox>
        </AppBox>
    );
}

function ScenarioFact({label, value}: {label: string; value: string}) {
    return (
        <AppBox sx={{display: "grid", gap: 0.1, minWidth: 0}}>
            <AppTypography variant="caption" color="text.secondary" sx={{fontWeight: 700}}>{label}</AppTypography>
            <AppTypography variant="body2" sx={{fontWeight: 700, overflowWrap: "anywhere"}}>{value}</AppTypography>
        </AppBox>
    );
}
