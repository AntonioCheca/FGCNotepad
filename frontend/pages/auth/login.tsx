import {useContext, useState} from "react";
import LoginForm from "@/src/components/forms/LoginForm";
import useAuth from "@/hooks/useAuth";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppCard} from "@/src/components/ui/AppCard";
import {AppCardContent} from "@/src/components/ui/AppCardContent";
import AuthContext from "@/services/AuthContext";

const LoginPage = () => {
    const {loginUser} = useAuth();
    const [error, setError] = useState("");
    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {login} = authContext;

    const handleLogin = async (username: string, password: string) => {
        setError("");
        try {
            const data = await loginUser(username, password);
            const token = data?.token;

            if (typeof token !== "string" || token.length === 0) {
                throw new Error("Missing auth token from login response");
            }

            login(token);
        } catch (error: unknown) {
            const normalizedError = error as {
                response?: {data?: {message?: string; error?: string}};
                message?: string;
            };
            const message = normalizedError.response?.data?.message
                || normalizedError.response?.data?.error
                || normalizedError.message;
            setError(message || "Invalid username or password");
        }
    };

    return (
        <AppContainer maxWidth="sm">
            <AppCard variant="outlined" sx={{mt: 4, p: 3}}>
                <AppCardContent>
                    <AppTypography variant="h4" align="center" gutterBottom>
                        Login
                    </AppTypography>
                    <LoginForm onSubmit={handleLogin} error={error}/>
                </AppCardContent>
            </AppCard>
        </AppContainer>
    );
};

export default LoginPage;
