import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppContainer} from "@/src/components/ui/AppContainer";

const AuthLayout = ({title, children}) => {
    return (
        <AppContainer maxWidth="sm">
            <AppPaper elevation={3} style={{padding: '20px', marginTop: '50px'}}>
                <AppTypography variant="h5" align="center" gutterBottom>
                    {title}
                </AppTypography>
                {children}
            </AppPaper>
        </AppContainer>
    );
};

export default AuthLayout;
