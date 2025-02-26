import { useState } from "react";
import { useRouter } from "next/router";
import { Container, Card, CardContent, Typography } from "@mui/material";
import LoginForm from "@/src/components/forms/LoginForm";
import { loginUser } from "@/services/api";

const LoginPage = () => {
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (username: string, password: string) => {
        setError("");
        try {
            await loginUser(username, password);
            router.push("/home");
        } catch (err) {
            setError(err.message || "Invalid username or password");
        }
    };

    return (
        <Container maxWidth="sm">
            <Card variant="outlined" sx={{ mt: 4, p: 3 }}>
                <CardContent>
                    <Typography variant="h4" align="center" gutterBottom>
                        Login
                    </Typography>
                    <LoginForm onSubmit={handleLogin} error={error} />
                </CardContent>
            </Card>
        </Container>
    );
};

export default LoginPage;
