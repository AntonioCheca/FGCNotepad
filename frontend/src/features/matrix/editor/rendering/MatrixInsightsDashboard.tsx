import React from "react";
import {MatrixInsights} from "../services/matrixInsightService";
import {StrategyMixChart} from "./StrategyMixChart";
import {ExpectedValueKpi} from "./ExpectedValueKpi";
import styles from "./matrixEditorRendering.module.css";

interface MatrixInsightsDashboardProps {
    insights: MatrixInsights;
}

export function MatrixInsightsDashboard({insights}: MatrixInsightsDashboardProps) {
    return (
        <div className={styles.insightsDashboard}>
            <div className={styles.insightsAttacker}>
                <StrategyMixChart title="Attacker Mix" data={insights.attackerMix}/>
            </div>
            <div className={styles.insightsDefender}>
                <StrategyMixChart title="Defender Mix" data={insights.defenderMix}/>
            </div>
            <div className={styles.insightsExpectedValue}>
                <ExpectedValueKpi expectedValue={insights.expectedValue}/>
            </div>
        </div>
    );
}
