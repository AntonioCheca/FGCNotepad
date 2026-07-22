import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {AuthProvider} from "@/services/AuthProvider";
import {ThemeModeProvider} from "@/src/context/ThemeContext";
import ThemeWrapper from "@/src/context/ThemeWrapper";
import {AppRouterCacheProvider} from "@/src/components/ui/AppRouterCacheProvider";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "FGC Notepad",
    description: "Fighting game matchup notes, combo study, and scenario analysis.",
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppRouterCacheProvider>
            <AuthProvider>
                <ThemeModeProvider>
                    <ThemeWrapper>{children}</ThemeWrapper>
                </ThemeModeProvider>
            </AuthProvider>
        </AppRouterCacheProvider>
        </body>
        </html>
    );
}
