import type {ReactNode} from "react";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

interface AuthLayoutProps {
    title: string;
    children: ReactNode;
}

const AuthLayout = ({title, children}: AuthLayoutProps) => {
    return (
        <AppContainer maxWidth="sm" sx={{px: {xs: 1.5, sm: 3}, py: {xs: 2.5, sm: 5}}}>
            <PageShell title={title}>
                <SectionCard title="Credentials" variant="input" tone="raised">
                    {children}
                </SectionCard>
            </PageShell>
        </AppContainer>
    );
};

export default AuthLayout;
