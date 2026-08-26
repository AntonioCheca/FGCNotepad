import type {ReactNode} from "react";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppContainer} from "@/src/components/ui/AppContainer";

interface AuthLayoutProps {
    title: string;
    children: ReactNode;
}

const AuthLayout = ({title, children}: AuthLayoutProps) => {
    return (
        <AppContainer maxWidth="sm" sx={{px: {xs: 1.5, sm: 3}, py: {xs: 2.5, sm: 5}}}>
            <AppPaper elevation={3} sx={{p: {xs: 2, sm: 2.5}, mt: {xs: 1, sm: 2}}}>
                <AppTypography variant="h5" align="center" gutterBottom>
                    {title}
                </AppTypography>
                {children}
            </AppPaper>
        </AppContainer>
    );
};

export default AuthLayout;
