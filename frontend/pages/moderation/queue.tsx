import React from "react";
import {useRouter} from "next/router";
import AuthContext from "@/services/AuthContext";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";

export default function ModerationQueuePage() {
    const authContext = React.useContext(AuthContext);
    const router = useRouter();

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {loading, isAuthenticated, canModerate} = authContext;

    React.useEffect(() => {
        if (loading) {
            return;
        }

        if (!isAuthenticated) {
            localStorage.setItem("redirectAfterLogin", "/moderation/queue");
            router.replace("/auth/login");
        }
    }, [isAuthenticated, loading, router]);

    if (loading) {
        return (
            <AppContainer maxWidth={false}>
                <AppCircularProgress/>
            </AppContainer>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (!canModerate) {
        return (
            <AppContainer maxWidth={false}>
                <AppTypography variant="h4" gutterBottom>Moderation Queue</AppTypography>
                <AppTypography>You do not have permission to access moderation tools.</AppTypography>
            </AppContainer>
        );
    }

    return (
        <AppContainer maxWidth={false}>
            <AppTypography variant="h4" gutterBottom>Moderation Queue</AppTypography>
            <AppTypography>Moderation queue UI ships in Ticket 9.</AppTypography>
        </AppContainer>
    );
}
