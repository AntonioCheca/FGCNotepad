// pages/_app.tsx
import type {AppProps} from 'next/app';
import type {ReactNode} from 'react';
import Head from 'next/head';
import {useRouter} from 'next/router';
import {useContext, useEffect} from 'react';
import {AuthProvider} from '@/services/AuthContext';
import SidebarLayout from '@/src/components/layouts/SidebarLayout';
import {ThemeModeProvider} from "@/src/context/ThemeContext";
import AuthContext from '@/services/AuthContext';
import {AppContainer} from '@/src/components/ui/AppContainer';
import {AppTypography} from '@/src/components/ui/AppTypography';

const PUBLIC_ROUTES = ['/auth/login', '/auth/register'];

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function rememberRedirectTarget(asPath: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    if (!asPath.startsWith('/auth/')) {
        localStorage.setItem('redirectAfterLogin', asPath);
    }
}

function AuthGate({children}: { children: ReactNode }) {
    const router = useRouter();
    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error('AuthContext must be used within an AuthProvider');
    }

    const {isAuthenticated, loading} = authContext;
    const isPublic = isPublicRoute(router.pathname);

    useEffect(() => {
        if (isPublic || loading || isAuthenticated) {
            return;
        }

        rememberRedirectTarget(router.asPath);
        void router.replace('/auth/login');
    }, [isAuthenticated, isPublic, loading, router]);

    if (isPublic) {
        return <>{children}</>;
    }

    if (loading || !isAuthenticated) {
        return (
            <AppContainer maxWidth="sm" sx={{py: 6}}>
                <AppTypography variant="h6" align="center">
                    Checking authentication...
                </AppTypography>
            </AppContainer>
        );
    }

    return <>{children}</>;
}

export default function App({Component, pageProps}: AppProps) {
    const router = useRouter();

    const hideSidebarRoutes = ['/auth', '/auth/login', '/auth/register'];
    const shouldHideSidebar = hideSidebarRoutes.some((route) =>
        router.pathname.startsWith(route)
    );

    return (
        <>
            <Head>
                <link rel="icon" href="/logos/favicon-color-pos.svg"/>
                <meta name="theme-color" content="#1e3c72"/>
            </Head>

            <AuthProvider>
                <ThemeModeProvider>
                    <AuthGate>
                        {shouldHideSidebar ? (
                            <Component {...pageProps} />
                        ) : (
                            <SidebarLayout>
                                <Component {...pageProps} />
                            </SidebarLayout>
                        )}
                    </AuthGate>
                </ThemeModeProvider>
            </AuthProvider>
        </>
    );
}
