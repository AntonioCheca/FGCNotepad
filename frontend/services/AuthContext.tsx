import { createContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("jwt");
        if (token) {
            console.log("Token found in localStorage, setting user.");
            setUser({ token });
        }
    }, []);

    const login = (token: string) => {
        console.log("Logging in, storing token.");
        localStorage.setItem("jwt", token);
        setUser({ token });
        router.push("/");
    };

    const logout = () => {
        console.log("Logging out, clearing user.");
        localStorage.removeItem("jwt");
        setUser(null);
        router.push("/login_check");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
