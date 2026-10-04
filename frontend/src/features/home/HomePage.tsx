import React from "react";
import AuthContext from "@/services/AuthContext";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {HomeFeatureCard} from "./HomeFeatureCard";
import {homeFeatures, type HomeFeature} from "./homeFeatures";

const visuallyHidden = {
    position: "absolute",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
} as const;

interface HomePageProps {
    // Hub pages show their title; the home page keeps it for screen readers only.
    title?: string;
    features?: HomeFeature[];
}

export default function HomePage({title, features = homeFeatures}: HomePageProps) {
    const authContext = React.useContext(AuthContext);
    const hasRole = authContext?.hasRole;
    const visibleFeatures = features.filter((feature) => !feature.allowedRoles || feature.allowedRoles.some((role) => hasRole?.(role)));

    const grid = (
        <AppBox
            sx={{
                display: "grid",
                gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))"},
                gap: {xs: 1, md: 1.5},
            }}
        >
            {visibleFeatures.map((feature) => (
                <HomeFeatureCard key={feature.href} feature={feature}/>
            ))}
        </AppBox>
    );

    return (
        <AppContainer maxWidth="lg" sx={{py: {xs: 1, md: 4}, px: {xs: 0, sm: 1, md: 3}}}>
            {title ? (
                <PageShell title={title}>{grid}</PageShell>
            ) : (
                <>
                    <AppTypography component="h1" sx={visuallyHidden}>Home</AppTypography>
                    {grid}
                </>
            )}
        </AppContainer>
    );
}
