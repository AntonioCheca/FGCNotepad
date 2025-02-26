import { useState } from "react";
import { TextField, Button, Typography } from "@mui/material";

interface LoginFormProps {
    onSubmit: (username: string, password: string) => void;
    error: string;
}

const LoginForm = ({ onSubmit, error }: LoginFormProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(username, password);
    };

    return (
        <form onSubmit={handleSubmit}>
            <TextField
                label="Username"
                variant="outlined"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            {error && <Typography color="error">{error}</Typography>}
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                Login
            </Button>
        </form>
    );
};

export default LoginForm;