'use client';

import {useState, useEffect, ReactNode, useCallback, useMemo, useRef} from "react";
import {useRouter} from "next/navigation";
import AuthContext, {AuthContextType} from "@/services/AuthContext";
import api, {clearCsrfToken, setCsrfToken} from "@/services/api";
import {AuthUser, UserRole} from "@/src/types/auth";

function getHttpStatus(error: unknown): number | null {
    if (!error || typeof error !== "object") {
        return null;
    }

    const response = (error as {response?: {status?: unknown}}).response;

    return typeof response?.status === "number" ? response.status : null;
}

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    const clearSession = useCallback(() => {
        clearCsrfToken();
        setUser(null);
    }, []);

    const refreshSession = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/me");
            const payload = response.data as {user?: AuthUser; csrfToken?: string};
            if (payload.user) {
                setUser(payload.user);
            }
            setCsrfToken(payload.csrfToken ?? null);
        } catch (error: unknown) {
            const status = getHttpStatus(error);
            if (status === 401 || status === 403) {
                clearSession();
            }
        } finally {
            setLoading(false);
        }
    }, [clearSession]);

    const eventHandlersRef = useRef({clearSession, router});

    useEffect(() => {
        eventHandlersRef.current = {clearSession, router};
    });

    useEffect(() => {
        void refreshSession();
    }, [refreshSession]);

    useEffect(() => {
        const handleUnauthorized = () => {
            eventHandlersRef.current.clearSession();

            if (window.location.pathname.startsWith('/auth/')) {
                return;
            }

            const currentPath = `${window.location.pathname}${window.location.search}`;
            localStorage.setItem('redirectAfterLogin', currentPath);
            eventHandlersRef.current.router.replace('/auth/login');
        };

        window.addEventListener("auth:unauthorized", handleUnauthorized);

        return () => {
            window.removeEventListener("auth:unauthorized", handleUnauthorized);
        };
    }, []);

    const login = useCallback((nextUser: AuthUser, nextCsrfToken: string, redirectPath?: string | null) => {
        setUser(nextUser);
        setCsrfToken(nextCsrfToken);

        const fallbackRedirectPath = localStorage.getItem("redirectAfterLogin");
        localStorage.removeItem("redirectAfterLogin");

        router.push(redirectPath || fallbackRedirectPath || "/combos");
    }, [router]);

    const logout = useCallback(async () => {
        try {
            await api.post("/logout");
        } finally {
            clearSession();
            router.push("/auth/login");
        }
    }, [clearSession, router]);

    const hasRole = useCallback((role: UserRole): boolean => {
        return Boolean(user?.roles?.includes(role));
    }, [user]);

    const isAuthenticated = user !== null;
    const canModerate = hasRole("ROLE_MODERATOR") || hasRole("ROLE_ADMIN");
    const canManageUsers = hasRole("ROLE_ADMIN");
    const contextValue = useMemo<AuthContextType>(() => ({
        user,
        loading,
        isAuthenticated,
        hasRole,
        canModerate,
        canManageUsers,
        login,
        logout,
    }), [canManageUsers, canModerate, hasRole, isAuthenticated, loading, login, logout, user]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}
