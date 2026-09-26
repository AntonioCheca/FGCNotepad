import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import type {NeutralStatsResponse} from "@/src/types/neutralStats";

export function NeutralSampleSummary({sample}: {sample: NeutralStatsResponse["sample"]}) {
    const observations = `${sample.observationCount.toLocaleString()} neutral observation${sample.observationCount === 1 ? "" : "s"}`;

    return (
        <AppBox sx={{display: "grid", gap: 0.75}}>
            <AppBox sx={{display: "flex", alignItems: "baseline", gap: 0.75, flexWrap: "wrap"}}>
                <AppTypography variant="body2" sx={{fontWeight: 650}}>{`${sample.observationCount.toLocaleString()} observation${sample.observationCount === 1 ? "" : "s"}`}</AppTypography>
                <AppTypography variant="caption" color="text.secondary">{`from ${sample.replayCount.toLocaleString()} replay${sample.replayCount === 1 ? "" : "s"}`}</AppTypography>
            </AppBox>
            {sample.lowSample && sample.observationCount > 0 ? (
                <InlineNotice severity="warning">{`Low sample size - ${observations}. Results may be noisy.`}</InlineNotice>
            ) : null}
        </AppBox>
    );
}
