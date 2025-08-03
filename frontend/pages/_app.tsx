// pages/_app.tsx
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/services/AuthContext';
import SidebarLayout from '@/src/components/layouts/SidebarLayout';

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();

    // List of routes where the sidebar should not appear
    const hideSidebarRoutes = ['/auth', '/auth/login', '/auth/register'];

    const shouldHideSidebar = hideSidebarRoutes.some((route) =>
        router.pathname.startsWith(route)
    );

    return (
        <>
            <Head>
                <link rel="icon" href="/favicon-color-pos.svg" />
                <meta name="theme-color" content="#1e3c72" />
            </Head>

            <AuthProvider>
                {shouldHideSidebar ? (
                    <Component {...pageProps} />
                ) : (
                    <SidebarLayout>
                        <Component {...pageProps} />
                    </SidebarLayout>
                )}
            </AuthProvider>
        </>
    );
}
