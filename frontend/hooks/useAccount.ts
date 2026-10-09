import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import type {AuthUser} from "@/src/types/auth";

export function useAccount() {
    const {request} = useApi();

    const acceptCurrentTerms = React.useCallback(async (): Promise<AuthUser> => {
        const payload = await request(() => api.post("/profile/terms-acceptance")) as {user: AuthUser};

        return payload.user;
    }, [request]);

    const requestAccountDeletion = React.useCallback(async (): Promise<void> => {
        await request(() => api.post("/profile/deletion-request"));
    }, [request]);

    return {acceptCurrentTerms, requestAccountDeletion};
}
