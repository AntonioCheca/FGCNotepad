import React from "react";

import AuthContext from "@/services/AuthContext";
import type {ScenarioExecutionPreference, ScenarioExecutionSelection} from "@/src/types/scenarioExecution";
import {DEFAULT_EXECUTION_SELECTION} from "../scenarioDetailUtils";

interface UseScenarioExecutionSelectionOptions {
    getExecutionPreference: () => Promise<ScenarioExecutionPreference>;
}

export function useScenarioExecutionSelection({getExecutionPreference}: UseScenarioExecutionSelectionOptions) {
    const authContext = React.useContext(AuthContext);
    const authLoading = authContext?.loading ?? true;
    const contextIsAuthenticated = authContext?.isAuthenticated ?? false;
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [executionSelection, setExecutionSelection] = React.useState<ScenarioExecutionSelection>(DEFAULT_EXECUTION_SELECTION);

    React.useEffect(() => {
        if (authLoading) {
            return;
        }

        setIsAuthenticated(contextIsAuthenticated);

        if (!contextIsAuthenticated) {
            return;
        }

        let canceled = false;
        getExecutionPreference()
            .then((preference) => {
                if (canceled) {
                    return;
                }

                setExecutionSelection({
                    mode: preference.defaultMode,
                    difficultyCap: preference.difficultyCap,
                });
            })
            .catch(() => {
                if (!canceled) {
                    setExecutionSelection(DEFAULT_EXECUTION_SELECTION);
                }
            });

        return () => {
            canceled = true;
        };
    }, [authLoading, contextIsAuthenticated, getExecutionPreference]);

    return {executionSelection, setExecutionSelection, isAuthenticated};
}
