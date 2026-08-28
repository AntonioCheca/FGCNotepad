import React from "react";
import Link from "next/link";

import {AppBox} from "@/src/components/ui/AppBox";
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
        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(0, 1fr) auto"}, alignItems: "center", gap: {xs: 0.8, md: 1.5}, pb: {xs: 1, md: 1.35}, borderBottom: "1px solid", borderColor: "divider", minWidth: 0}}>
            <AppTypography variant="h4" sx={{fontWeight: 800, fontSize: {xs: "clamp(1.7rem, 9vw, 2.25rem)", md: undefined}, lineHeight: {xs: 1.02, md: undefined}}}>View Scenario</AppTypography>
            <AppBox sx={{display: "flex", alignItems: "center", gap: {xs: 0.65, md: 1}, flexWrap: "wrap", justifyContent: {xs: "stretch", md: "flex-end"}, "& .MuiButton-root": {flex: {xs: "1 1 100%", sm: "1 1 calc(50% - 6px)", md: "0 0 auto"}}}}>
                <ContentFlagButton targetType="scenario" targetId={scenarioId}/>
                <AppButton type="button" disabled={refreshingDynamicCombos} onClick={onRefreshDynamicCombos}>
                    {refreshingDynamicCombos ? "Refreshing..." : "Refresh Dynamic Combos"}
                </AppButton>
                <Link href={`/scenarios/${scenarioId}/edit`} style={{textDecoration: "none"}}>
                    <AppButton type="button">Edit Scenario</AppButton>
                </Link>
            </AppBox>
        </AppBox>
    );
}
