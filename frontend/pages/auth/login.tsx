import {useContext, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import LoginForm from "@/src/components/forms/LoginForm";
import useAuth from "@/hooks/useAuth";
import {AppTypography} from "@/src/components/ui/AppTypography";
import AuthContext from "@/services/AuthContext";
import {AuthUser} from "@/src/types/auth";
import AuthLayout from "@/src/components/layouts/AuthLayout";

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
        <AuthLayout title="Login">
            <LoginForm onSubmit={handleLogin} error={error}/>
            <AppTypography variant="body2" align="center" sx={{mt: 2}}>
                You don&apos;t have an account?{' '}
                <Link href="/auth/register" style={{color: "inherit", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "2px"}}>Register here</Link>
            </AppTypography>
        </AuthLayout>
    );
};

export default LoginPage;
