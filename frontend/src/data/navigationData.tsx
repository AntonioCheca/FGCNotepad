import {MobileTab, NavigationSection} from "@/src/types/navigation";
import type {UserRole} from "@/src/types/auth";
import {
    AccountCircleOutlinedIcon,
    AltRouteIcon,
    ArticleOutlinedIcon,
    FactCheckOutlinedIcon,
    HelpOutlineOutlinedIcon,
    HomeOutlinedIcon,
    Inventory2OutlinedIcon,
    ManageAccountsOutlinedIcon,
    PendingActionsIcon,
    PlaceOutlinedIcon,
    QueryStatsIcon,
    ScheduleIcon,
    ShieldOutlinedIcon,
    OkiKnockdownIcon,
    SportsKabaddiOutlinedIcon,
    SportsMmaIcon,
    TableChartOutlinedIcon,
    TimelineIcon,
    UploadFileOutlinedIcon,
} from "@/src/components/ui/AppIcons";

const QA_ROLES: UserRole[] = ["ROLE_QA_TESTER", "ROLE_ADMIN"];

export const navigationSections: NavigationSection[] = [
    {
        title: "Combos",
        items: [
            {
                label: "Search Combos",
                href: "/combos",
                icon: <SportsMmaIcon/>
            }
        ]
    },
    {
        title: "Okis",
        items: [
            {
                label: "Search Okis",
                href: "/okis",
                icon: <OkiKnockdownIcon/>
            }
        ]
    },
    {
        title: "Scenarios",
        items: [
            {
                label: "Search Scenarios",
                href: "/scenarios",
                icon: <AltRouteIcon/>
            }
        ]
    },
    {
        title: "Stats",
        items: [
            {
                label: "Neutral Stats",
                href: "/neutral-stats",
                icon: <QueryStatsIcon/>
            }
        ]
    },
    {
        title: "Replay Lab",
        items: [
            {
                label: "Replay Lab",
                href: "/replay-lab",
                icon: <TimelineIcon/>,
                requiresAuth: true,
                allowedRoles: QA_ROLES,
            },
            {
                label: "Practice Tasks",
                href: "/replay-lab/practice-tasks",
                icon: <PendingActionsIcon/>,
                requiresAuth: true,
                allowedRoles: QA_ROLES,
            },
            {
                label: "Study Deck",
                href: "/replay-lab/study-deck",
                icon: <ScheduleIcon/>,
                requiresAuth: true,
                allowedRoles: QA_ROLES,
            }
        ]
    },
    {
        title: "Blockstrings",
        items: [
            {
                label: "Blockstrings",
                href: "/blockstrings",
                icon: <SportsKabaddiOutlinedIcon/>
            }
        ]
    },
    {
        title: "Guides",
        items: [
            {
                label: "Beginners Guides",
                href: "/guides",
                icon: <ArticleOutlinedIcon/>
            }
        ]
    }
];

export const accountNavigationSections: NavigationSection[] = [
    {
        title: "Account",
        items: [
            {
                label: "Profile",
                href: "/profile",
                icon: <AccountCircleOutlinedIcon/>,
                requiresAuth: true,
            }
        ]
    },
    {
        title: "Moderation",
        items: [
            {
                label: "Moderation Queue",
                href: "/moderation/queue",
                icon: <FactCheckOutlinedIcon/>,
                requiresAuth: true,
                allowedRoles: ["ROLE_MODERATOR", "ROLE_ADMIN"],
            },
            {
                label: "Frame Data",
                href: "/moderation/frame-data",
                icon: <TableChartOutlinedIcon/>,
                requiresAuth: true,
                allowedRoles: ["ROLE_MODERATOR", "ROLE_ADMIN"],
            },
            {
                label: "Resources",
                href: "/moderation/resources",
                icon: <Inventory2OutlinedIcon/>,
                requiresAuth: true,
                allowedRoles: ["ROLE_MODERATOR", "ROLE_ADMIN"],
            },
            {
                label: "Situations",
                href: "/admin/situations",
                icon: <PlaceOutlinedIcon/>,
                requiresAuth: true,
                allowedRoles: ["ROLE_MODERATOR", "ROLE_ADMIN"],
            }
        ]
    },
    {
        title: "Admin",
        items: [
            {
                label: "User Management",
                href: "/admin/users",
                icon: <ManageAccountsOutlinedIcon/>,
                requiresAuth: true,
                allowedRoles: ["ROLE_ADMIN"],
            },
            {
                label: "Replay Import",
                href: "/admin/replay-combo-imports",
                icon: <UploadFileOutlinedIcon/>,
                requiresAuth: true,
                allowedRoles: ["ROLE_ADMIN"],
            }
        ]
    },
    {
        title: "About",
        items: [
            {
                label: "About Us",
                href: "/about/aboutUs",
                icon: <HelpOutlineOutlinedIcon/>
            },
            {
                label: "Privacy Policy",
                href: "/privacy",
                icon: <ShieldOutlinedIcon/>
            },
            {
                label: "Terms of Use",
                href: "/terms",
                icon: <ArticleOutlinedIcon/>
            }
        ]
    }
];

// Phone/tablet bottom bar. Everything else is reachable from its "More" sheet.
export const mobileTabs: MobileTab[] = [
    {label: "Home", href: "/", icon: <HomeOutlinedIcon/>, activePrefixes: []},
    {label: "Combos", href: "/combos", icon: <SportsMmaIcon/>, activePrefixes: ["/combos"]},
    {label: "Okis", href: "/okis", icon: <OkiKnockdownIcon/>, activePrefixes: ["/okis"]},
    {label: "Scenarios", href: "/scenarios", icon: <AltRouteIcon/>, activePrefixes: ["/scenarios"]},
];
