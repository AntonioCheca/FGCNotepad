import { Container, Typography } from "@mui/material";

const HomePage = () => {
    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Typography variant="h4" align="center">
                Welcome to FGCNotepad!
            </Typography>
        </Container>
    );
};

export default HomePage;
