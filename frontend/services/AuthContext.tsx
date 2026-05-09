'use client';

import {createContext, useState, useEffect, ReactNode, useCallback} from "react";
import {useRouter} from "next/navigation";
import {fetchCurrentUserProfile} from "@/services/authProfile";
import {clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken} from "@/services/api";
import {AuthUser, UserRole} from "@/src/types/auth";

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    hasRole: (role: UserRole) => boolean;
    canModerate: boolean;
    canManageUsers: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getHttpStatus(error: unknown): number | null {
    if (!error || typeof error !== "object") {
        return null;
    }

    const response = (error as {response?: {status?: unknown}}).response;

    return typeof response?.status === "number" ? response.status : null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    const [, payload] = token.split(".");
    if (!payload) {
        return null;
    }

    try {
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

        return JSON.parse(atob(padded)) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function isUserRole(role: unknown): role is UserRole {
    return role === "ROLE_USER" || role === "ROLE_MODERATOR" || role === "ROLE_ADMIN";
}

function buildUserFromToken(token: string): AuthUser | null {
    const payload = decodeJwtPayload(token);
    if (!payload) {
        return null;
    }

    const username = typeof payload.username === "string"
        ? payload.username
        : typeof payload.user === "string"
            ? payload.user
            : null;

    if (!username) {
        return null;
    }

    const roles = Array.isArray(payload.roles)
        ? payload.roles.filter(isUserRole)
        : [];

    return {
        token,
        id: typeof payload.id === "string" ? payload.id : "",
        username,
        roles: roles.length > 0 ? roles : ["ROLE_USER"],
        isActive: true,
    };
}

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    const clearSession = useCallback(() => {
        clearStoredAuthToken();
        setUser(null);
    }, []);

    const hydrateUserFromToken = useCallback(async (token: string) => {
        setLoading(true);
        try {
            const profile = await fetchCurrentUserProfile();
            setUser({token, ...profile});
        } catch (error: unknown) {
            const status = getHttpStatus(error);
            if (status === 401 || status === 403) {
                clearSession();
                return;
            }

            const userFromToken = buildUserFromToken(token);
            if (userFromToken) {
                setUser(userFromToken);
            }
        } finally {
            setLoading(false);
        }
    }, [clearSession]);

    useEffect(() => {
        const token = getStoredAuthToken();
        if (!token) {
            setLoading(false);
            return;
        }

        void hydrateUserFromToken(token);
    }, [hydrateUserFromToken]);

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key !== "jwt" && event.key !== "token") {
                return;
            }

            const token = getStoredAuthToken();

            if (!token) {
                setUser(null);
                return;
            }

            void hydrateUserFromToken(token);
        };

        const handleUnauthorized = () => {
            clearSession();

            if (window.location.pathname.startsWith('/auth/')) {
                return;
            }

            const currentPath = `${window.location.pathname}${window.location.search}`;
            localStorage.setItem('redirectAfterLogin', currentPath);
            router.replace('/auth/login');
        };

        window.addEventListener("storage", handleStorage);
        window.addEventListener("auth:unauthorized", handleUnauthorized);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("auth:unauthorized", handleUnauthorized);
        };
    }, [clearSession, hydrateUserFromToken, router]);

    const login = (token: string) => {
        setStoredAuthToken(token);
        const normalizedToken = getStoredAuthToken();
        if (normalizedToken) {
            void hydrateUserFromToken(normalizedToken);
        }

        const redirectPath = localStorage.getItem("redirectAfterLogin");
        localStorage.removeItem("redirectAfterLogin");
        router.push(redirectPath || "/home");
    };

    const logout = () => {
        clearSession();
        router.push("/auth/login");
    };

    const hasRole = useCallback((role: UserRole): boolean => {
        return Boolean(user?.roles?.includes(role));
    }, [user]);

    const isAuthenticated = user !== null;
    const canModerate = hasRole("ROLE_MODERATOR") || hasRole("ROLE_ADMIN");
    const canManageUsers = hasRole("ROLE_ADMIN");

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated,
            hasRole,
            canModerate,
            canManageUsers,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
