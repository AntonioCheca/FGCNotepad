import { useContext } from "react";
import AuthContext from "@/services/AuthContext";
import { AppContainer } from "@/src/components/ui/AppContainer";
import { AppTypography } from "@/src/components/ui/AppTypography";
import { AppCircularProgress } from "@/src/components/ui/AppCircularProgress";
import Sidebar from "@/src/components/layouts/Sidebar";
import HeroSection from "@/src/components/home/HeroSection";
import MockSections from "@/src/components/home/MockSections";
import { Box } from "@mui/material";

export default function HomePage() {
    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const { user, loading } = authContext;

    if (loading) {
        return <AppCircularProgress sx={{ display: "block", margin: "auto", mt: 4 }} />;
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, marginLeft: '280px', padding: 0 }}>
                <AppContainer maxWidth="xl" sx={{ mt: 0, padding: 0 }}>
                    {/* Hero Section with Large Logo */}
                    <HeroSection />

                    {/* Mock Sections for Testing Buttons and Components */}
                    <MockSections />
                </AppContainer>
            </Box>
        </Box>
    );
}
