import React from "react";
import {MatrixInsights} from "../services/matrixInsightService";
import {StrategyMixChart} from "./StrategyMixChart";
import {ExpectedValueRangeChart} from "./ExpectedValueRangeChart";

interface MatrixInsightsDashboardProps {
    insights: MatrixInsights;
}

export function MatrixInsightsDashboard({insights}: MatrixInsightsDashboardProps) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(300px, 1fr) minmax(360px, 1fr)",
                gap: 10,
                marginBottom: 10,
            }}
        >
            <div style={{display: "grid", gridTemplateRows: "1fr 1fr", gap: 10, minWidth: 0}}>
                <StrategyMixChart
                    title="Attacker Mix"
                    data={insights.attackerMix.map((item) => ({label: item.label, frequency: item.frequency}))}
                />
                <StrategyMixChart
                    title="Defender Mix"
                    data={insights.defenderMix.map((item) => ({label: item.label, frequency: item.frequency}))}
                />
            </div>
            <div style={{minWidth: 0}}>
                <ExpectedValueRangeChart
                    expectedValue={insights.expectedValue}
                    expectedValueHpPercent={insights.expectedValueHpPercent}
                    histogram={insights.evHistogram}
                />
            </div>
        </div>
    );
}
