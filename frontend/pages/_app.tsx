import type {AppProps} from 'next/app';
import Head from 'next/head';
import {useRouter} from 'next/router';
import {AuthProvider} from '@/services/AuthProvider';
import SidebarLayout from '@/src/components/layouts/SidebarLayout';
import {ThemeModeProvider} from "@/src/context/ThemeContext";

export default function App({Component, pageProps}: AppProps) {
    const router = useRouter();

    const hideSidebarRoutes = ['/auth', '/auth/login', '/auth/register'];
    const shouldHideSidebar = hideSidebarRoutes.some((route) =>
        router.pathname.startsWith(route)
    );

    return (
        <>
            <Head>
                <title>FG Theory</title>
                <link rel="icon" href="/logos/favicon-color-pos.svg"/>
                <meta name="theme-color" content="#1e3c72"/>
            </Head>

            <AuthProvider>
                <ThemeModeProvider>
                    {shouldHideSidebar ? (
                        <Component {...pageProps} />
                    ) : (
                        <SidebarLayout>
                            <Component {...pageProps} />
                        </SidebarLayout>
                    )}
                </ThemeModeProvider>
            </AuthProvider>
        </>
    );
}
