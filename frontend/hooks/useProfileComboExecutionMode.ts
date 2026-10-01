import React from "react";

import {useExecutionProfile} from "@/hooks/useExecutionProfile";
import AuthContext from "@/services/AuthContext";
import type {ComboExecutionMode} from "@/src/types/comboExecution";

/** The signed-in user's default combo execution mode; guests and failed loads fall back to Classic. */
export function useProfileComboExecutionMode(): {mode: ComboExecutionMode; loading: boolean} {
    const {getComboExecutionMode} = useExecutionProfile();
    const authContext = React.useContext(AuthContext);
    const authLoading = authContext?.loading ?? true;
    const isAuthenticated = authContext?.isAuthenticated ?? false;
    const [mode, setMode] = React.useState<ComboExecutionMode>("classic");
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (authLoading) {
            return;
        }
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        let canceled = false;
        getComboExecutionMode()
            .then((preference) => {
                if (!canceled) {
                    setMode(preference.comboExecutionMode);
                }
            })
            .catch(() => undefined)
            .finally(() => {
                if (!canceled) {
                    setLoading(false);
                }
            });

        return () => {
            canceled = true;
        };
    }, [authLoading, getComboExecutionMode, isAuthenticated]);

    return {mode, loading};
}
