export type UserRole = "ROLE_USER" | "ROLE_MODERATOR" | "ROLE_ADMIN";

export interface AuthProfile {
    id: string;
    username: string;
    roles: UserRole[];
    isActive: boolean;
}

export type AuthUser = AuthProfile;
