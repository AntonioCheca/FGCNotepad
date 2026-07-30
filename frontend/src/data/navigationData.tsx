import {NavigationSection} from "@/src/types/navigation";
import {
    AccountCircleOutlinedIcon,
    ArticleOutlinedIcon,
    HelpOutlineOutlinedIcon,
    PendingActionsIcon,
    SearchOutlinedIcon,
    SettingsOutlinedIcon,
    ScheduleIcon,
    SportsKabaddiOutlinedIcon,
    SportsMartialArtsOutlinedIcon,
    SportsMmaIcon,
    TimelineIcon,
} from "@/src/components/ui/AppIcons";

export const navigationSections: NavigationSection[] = [
    {
        title: "Combos",
        items: [
            {
                label: "Search Combos",
                href: "/combos",
                icon: <SportsMmaIcon/> // related but distinct sports icon
            },
            {
                label: "Create Combo",
                href: "/combos/new",
                icon: <SportsMartialArtsOutlinedIcon/> // main combos icon
            }
        ]
    },
    {
        title: "Okis",
        items: [
            {
                label: "Search Okis",
                href: "/okis",
                icon: <SearchOutlinedIcon/>
            },
            {
                label: "Create Oki",
                href: "/okis/new",
                icon: <SportsKabaddiOutlinedIcon/>
            },
            {
                label: "Reversals",
                href: "/okis/reversals",
                icon: <PendingActionsIcon/>
            }
        ]
    },
    {
        title: "Scenarios",
        items: [
            {
                label: "Search Scenarios",
                href: "/scenarios",
                icon: <SearchOutlinedIcon/>
            },
            {
                label: "Create Scenario",
                href: "/scenarios/new",
                icon: <SportsKabaddiOutlinedIcon/>
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
            },
            {
                label: "Practice Tasks",
                href: "/replay-lab/practice-tasks",
                icon: <PendingActionsIcon/>,
                requiresAuth: true,
            },
            {
                label: "Study Deck",
                href: "/replay-lab/study-deck",
                icon: <ScheduleIcon/>,
                requiresAuth: true,
            }
        ]
    },
    {
        title: "Account",
        items: [
            {
                label: "Profile",
                href: "/profile",
                icon: <AccountCircleOutlinedIcon/>, // user icon for profile
                requiresAuth: true,
            },
            {
                label: "Recommend me a new combo",
                href: "/profile/recommend-combo",
                icon: <SportsMartialArtsOutlinedIcon/>,
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
                icon: <PendingActionsIcon/>,
                requiresAuth: true,
                allowedRoles: ["ROLE_MODERATOR", "ROLE_ADMIN"],
            },
            {
                label: "Frame Data",
                href: "/moderation/frame-data",
                icon: <ArticleOutlinedIcon/>,
                requiresAuth: true,
                allowedRoles: ["ROLE_MODERATOR", "ROLE_ADMIN"],
            },
            {
                label: "Situations",
                href: "/admin/situations",
                icon: <SearchOutlinedIcon/>,
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
                icon: <SettingsOutlinedIcon/>,
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
                icon: <HelpOutlineOutlinedIcon/> // help icon for info/about
            }
        ]
    }
];
