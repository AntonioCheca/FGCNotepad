import React from "react";

import type {ScenarioDetail} from "@/hooks/useScenarios";

interface UseScenarioDetailDataOptions {
    scenarioId: string | null;
    getScenario: (id: string) => Promise<ScenarioDetail>;
}

export function useScenarioDetailData({scenarioId, getScenario}: UseScenarioDetailDataOptions) {
    const [scenario, setScenario] = React.useState<ScenarioDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!scenarioId) {
            return;
        }

        let canceled = false;
        setLoading(true);
        setError(null);
        setScenario(null);

        getScenario(scenarioId)
            .then((data) => {
                if (!canceled) {
                    setScenario(data);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setError("Unable to load scenario.");
                }
            })
            .finally(() => {
                if (!canceled) {
                    setLoading(false);
                }
            });

        return () => {
            canceled = true;
        };
    }, [scenarioId, getScenario]);

    return {scenario, setScenario, loading, error};
}
