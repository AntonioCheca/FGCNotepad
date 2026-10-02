import {JSX} from "react";
import type {UserRole} from "@/src/types/auth";
import {
    AltRouteIcon,
    QueryStatsIcon,
    SportsKabaddiOutlinedIcon,
    SportsMartialArtsOutlinedIcon,
    SportsMmaIcon,
    TimelineIcon,
} from "@/src/components/ui/AppIcons";

export interface HomeFeature {
    label: string;
    href: string;
    icon: JSX.Element;
    allowedRoles?: UserRole[];
}

export const homeFeatures: HomeFeature[] = [
    {
        label: "Combos",
        href: "/combos",
        icon: <SportsMmaIcon/>,
    },
    {
        label: "Okis",
        href: "/okis",
        icon: <SportsKabaddiOutlinedIcon/>,
    },
    {
        label: "Blockstrings",
        href: "/blockstrings/offense",
        icon: <SportsMartialArtsOutlinedIcon/>,
    },
    {
        label: "Scenarios",
        href: "/scenarios",
        icon: <AltRouteIcon/>,
    },
    {
        label: "Neutral Stats",
        href: "/neutral-stats",
        icon: <QueryStatsIcon/>,
    },
    {
        label: "Replay Lab",
        href: "/replay-lab",
        icon: <TimelineIcon/>,
        allowedRoles: ["ROLE_QA_TESTER", "ROLE_ADMIN"],
    },
];
