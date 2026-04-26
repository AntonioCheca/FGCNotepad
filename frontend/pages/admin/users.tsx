import React from "react";
import {useRouter} from "next/router";
import AuthContext from "@/services/AuthContext";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";

export default function AdminUsersPage() {
    const authContext = React.useContext(AuthContext);
    const router = useRouter();

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {loading, isAuthenticated, canManageUsers} = authContext;

    React.useEffect(() => {
        if (loading) {
            return;
        }

        if (!isAuthenticated) {
            localStorage.setItem("redirectAfterLogin", "/admin/users");
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

    if (!canManageUsers) {
        return (
            <AppContainer maxWidth={false}>
                <AppTypography variant="h4" gutterBottom>User Management</AppTypography>
                <AppTypography>You do not have permission to access admin user management.</AppTypography>
            </AppContainer>
        );
    }

    return (
        <AppContainer maxWidth={false}>
            <AppTypography variant="h4" gutterBottom>User Management</AppTypography>
            <AppTypography>Admin user management UI ships in Ticket 10.</AppTypography>
        </AppContainer>
    );
}
