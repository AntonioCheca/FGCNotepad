import {createContext} from "react";
import {AuthUser, UserRole} from "@/src/types/auth";

export interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    hasRole: (role: UserRole) => boolean;
    canModerate: boolean;
    canManageUsers: boolean;
    login: (user: AuthUser, csrfToken: string, redirectPath?: string | null) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
