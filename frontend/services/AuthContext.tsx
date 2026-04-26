'use client';

import {createContext, useState, useEffect, ReactNode, useCallback} from "react";
import {useRouter} from "next/navigation";
import {fetchCurrentUserProfile} from "@/services/authProfile";
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

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    const clearSession = useCallback(() => {
        localStorage.removeItem("jwt");
        setUser(null);
    }, []);

    const hydrateUserFromToken = useCallback(async (token: string) => {
        setLoading(true);
        try {
            const profile = await fetchCurrentUserProfile();
            setUser({token, ...profile});
        } catch {
            clearSession();
        } finally {
            setLoading(false);
        }
    }, [clearSession]);

    useEffect(() => {
        const token = localStorage.getItem("jwt");
        if (!token) {
            setLoading(false);
            return;
        }

        void hydrateUserFromToken(token);
    }, [hydrateUserFromToken]);

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key !== "jwt") {
                return;
            }

            if (!event.newValue) {
                setUser(null);
                return;
            }

            void hydrateUserFromToken(event.newValue);
        };

        const handleUnauthorized = () => {
            clearSession();
        };

        window.addEventListener("storage", handleStorage);
        window.addEventListener("auth:unauthorized", handleUnauthorized);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("auth:unauthorized", handleUnauthorized);
        };
    }, [clearSession, hydrateUserFromToken]);

    const login = (token: string) => {
        localStorage.setItem("jwt", token);
        void hydrateUserFromToken(token);
        const redirectPath = localStorage.getItem("redirectAfterLogin");
        localStorage.removeItem("redirectAfterLogin");
        router.push(redirectPath || "/");
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
