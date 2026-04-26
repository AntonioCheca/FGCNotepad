import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {AdminUserRole, AdminUsersListResponse, AdminUserUpdateResponse} from "@/src/types/adminUsers";

export function useAdminUsers() {
    const {request} = useApi();

    const listUsers = React.useCallback(async (page: number, size: number): Promise<AdminUsersListResponse> => {
        return request(() =>
            api.get("/admin/users", {
                params: {
                    page,
                    size,
                },
            })
        );
    }, [request]);

    const updateUserRoles = React.useCallback(async (userId: string, roles: AdminUserRole[]): Promise<AdminUserUpdateResponse> => {
        return request(() =>
            api.patch(`/admin/users/${userId}/roles`, {
                roles,
            })
        );
    }, [request]);

    const deactivateUser = React.useCallback(async (userId: string): Promise<AdminUserUpdateResponse> => {
        return request(() => api.post(`/admin/users/${userId}/deactivate`));
    }, [request]);

    return {
        listUsers,
        updateUserRoles,
        deactivateUser,
    };
}
