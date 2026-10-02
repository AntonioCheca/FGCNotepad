import Link from "next/link";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {ChevronRightIcon} from "@/src/components/ui/AppIcons";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import type {HomeFeature} from "./homeFeatures";

interface HomeFeatureCardProps {
    feature: HomeFeature;
}

export function HomeFeatureCard({feature}: HomeFeatureCardProps) {
    return (
        <AppBox
            sx={{
                "& > a": {display: "block", textDecoration: "none", color: "inherit", borderRadius: 1.5},
                "& > a:focus-visible": {
                    outline: "2px solid",
                    outlineColor: (theme: Theme) => theme.fgc.focus.outline,
                    outlineOffset: 2,
                },
            }}
        >
            <Link href={feature.href}>
                <AppBox
                    sx={{
                        display: "flex",
                        flexDirection: {xs: "row", sm: "column"},
                        alignItems: {xs: "center", sm: "flex-start"},
                        justifyContent: "space-between",
                        gap: 1.5,
                        minHeight: {xs: 76, sm: 168},
                        px: {xs: 2, md: 2.5},
                        py: {xs: 1.5, md: 2.25},
                        border: "1px solid",
                        borderColor: (theme: Theme) => theme.fgc.border.default,
                        borderRadius: 1.5,
                        backgroundColor: (theme: Theme) => theme.fgc.surface.base,
                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                        "& .home-card-icon, & .home-card-arrow": {
                            color: (theme: Theme) => theme.fgc.icon.muted,
                            transition: "color 0.2s ease, transform 0.2s ease",
                        },
                        "a:hover > &": {
                            backgroundColor: (theme: Theme) => theme.fgc.surface.raised,
                            borderColor: (theme: Theme) => theme.fgc.accent.selected,
                        },
                        "a:hover > & .home-card-icon, a:hover > & .home-card-arrow": {
                            color: (theme: Theme) => theme.fgc.accent.selected,
                        },
                        "a:hover > & .home-card-arrow": {
                            transform: "translateX(3px)",
                        },
                    }}
                >
                    <AppBox className="home-card-icon" sx={{display: "inline-flex", "& svg": {fontSize: {xs: 28, sm: 40}}}}>
                        {feature.icon}
                    </AppBox>

                    <AppBox sx={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexGrow: 1, width: {sm: "100%"}, minWidth: 0}}>
                        <AppTypography component="h2" variant="h6" sx={{fontWeight: 650, lineHeight: 1.2}}>
                            {feature.label}
                        </AppTypography>
                        <AppBox className="home-card-arrow" sx={{display: "inline-flex"}}>
                            <ChevronRightIcon/>
                        </AppBox>
                    </AppBox>
                </AppBox>
            </Link>
        </AppBox>
    );
}
