import {useContext, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import LoginForm from "@/src/components/forms/LoginForm";
import useAuth from "@/hooks/useAuth";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppCard} from "@/src/components/ui/AppCard";
import {AppCardContent} from "@/src/components/ui/AppCardContent";
import AuthContext from "@/services/AuthContext";
import {AuthUser} from "@/src/types/auth";

const LoginPage = () => {
    const {loginUser} = useAuth();
    const router = useRouter();
    const [error, setError] = useState("");
    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {login} = authContext;

    const redirectQuery = Array.isArray(router.query.redirect) ? router.query.redirect[0] : router.query.redirect;
    const safeRedirectPath = typeof redirectQuery === "string" && redirectQuery.startsWith("/") && !redirectQuery.startsWith("//")
        ? redirectQuery
        : null;

    const handleLogin = async (username: string, password: string) => {
        setError("");
        try {
            const data = await loginUser(username, password);
            const user = data?.user as AuthUser | undefined;
            const csrfToken = data?.csrfToken;

            if (!user || typeof csrfToken !== "string" || csrfToken.length === 0) {
                throw new Error("Missing session data from login response");
            }

            login(user, csrfToken, safeRedirectPath);
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
                    <AppTypography variant="body2" align="center" sx={{mt: 2}}>
                        You don&apos;t have an account?{' '}
                        <Link href="/auth/register">Register here</Link>
                    </AppTypography>
                </AppCardContent>
            </AppCard>
        </AppContainer>
    );
};

export default LoginPage;
