import {useState} from "react";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";

interface LoginFormProps {
    onSubmit: (username: string, password: string) => void;
    error: string;
}

const LoginForm = ({onSubmit, error}: LoginFormProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(username, password);
    };

    return (
        <form onSubmit={handleSubmit}>
            <AppTextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <AppTextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            {error && <AppTypography color="error">{error}</AppTypography>}
            <AppButton fullWidth sx={{mt: 2}}>
                Login
            </AppButton>
        </form>
    );
};

export default LoginForm;