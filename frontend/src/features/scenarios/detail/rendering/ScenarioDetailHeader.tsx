import React from "react";
import Link from "next/link";

import {AppButton} from "@/src/components/ui/AppButton";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ContentFlagButton} from "@/src/components/flags/ContentFlagButton";

interface ScenarioDetailHeaderProps {
    scenarioId: string;
    refreshingDynamicCombos: boolean;
    onRefreshDynamicCombos: () => void;
}

export function ScenarioDetailHeader({scenarioId, refreshingDynamicCombos, onRefreshDynamicCombos}: ScenarioDetailHeaderProps) {
    return (
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12}}>
            <AppTypography variant="h4">View Scenario</AppTypography>
            <div style={{display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end"}}>
                <ContentFlagButton targetType="scenario" targetId={scenarioId}/>
                <AppButton type="button" disabled={refreshingDynamicCombos} onClick={onRefreshDynamicCombos}>
                    {refreshingDynamicCombos ? "Refreshing..." : "Refresh Dynamic Combos"}
                </AppButton>
                <Link href={`/scenarios/${scenarioId}/edit`} style={{textDecoration: "none"}}>
                    <AppButton type="button">Edit Scenario</AppButton>
                </Link>
            </div>
        </div>
    );
}
