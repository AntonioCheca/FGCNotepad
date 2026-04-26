export type AdminUserRole = "ROLE_USER" | "ROLE_MODERATOR" | "ROLE_ADMIN";

export interface AdminUserRow {
    id: string;
    username: string;
    roles: AdminUserRole[];
    isActive: boolean;
    deactivatedAt: string | null;
}

export interface AdminUsersListResponse {
    page: number;
    size: number;
    total: number;
    data: AdminUserRow[];
}

export interface AdminUserUpdateResponse {
    id: string;
    username: string;
    roles: AdminUserRole[];
    isActive: boolean;
    deactivatedAt: string | null;
}
