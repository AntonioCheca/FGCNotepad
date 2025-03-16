'use client';

import {createContext, useState, useEffect, ReactNode} from "react";
import {useRouter} from "next/navigation";

interface User {
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("jwt");
        if (token) {
            setUser({token});
        }
    }, []);

    const login = (token: string) => {
        localStorage.setItem("jwt", token);
        setUser({token});
        const redirectPath = localStorage.getItem("redirectAfterLogin");
        localStorage.removeItem("redirectAfterLogin");
        router.push(redirectPath || "/");
    };

    const logout = () => {
        localStorage.removeItem("jwt");
        setUser(null);
        router.push("/login_check");
    };

    return (
        <AuthContext.Provider value={{user, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
