import { Container, Paper, Typography } from '@mui/material';

const AuthLayout = ({ title, children }) => {
    return (
        <Container maxWidth="sm">
            <Paper elevation={3} style={{ padding: '20px', marginTop: '50px' }}>
                <Typography variant="h5" align="center" gutterBottom>
                    {title}
                </Typography>
                {children}
            </Paper>
        </Container>
    );
};

export default AuthLayout;
