import {useState} from "react";
import {useRouter} from "next/router";
import LoginForm from "@/src/components/forms/LoginForm";
import useAuth from "@/hooks/useAuth";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppCard} from "@/src/components/ui/AppCard";
import {AppCardContent} from "@/src/components/ui/AppCardContent";

const LoginPage = () => {
    const {loginUser} = useAuth();
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (username: string, password: string) => {
        setError("");
        try {
            await loginUser(username, password);
            const from = router.location?.state?.from || "/home";
            router.push(from);
        } catch (err) {
            setError(err.message || "Invalid username or password");
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
