import {NavigationSection} from "@/src/types/navigation";
import {
    AccountCircleOutlinedIcon,
    ArticleOutlinedIcon,
    HelpOutlineOutlinedIcon,
    SearchOutlinedIcon,
    SettingsOutlinedIcon,
    SportsKabaddiOutlinedIcon,
    SportsMartialArtsOutlinedIcon,
    SportsMmaIcon,
} from "@/src/components/ui/AppIcons";

export const navigationSections: NavigationSection[] = [
    {
        title: "Posts",
        items: [
            {
                label: "Search Posts",
                href: "/home",
                icon: <SearchOutlinedIcon/>  // magnifying glass for searching
            },
            {
                label: "Create Post",
                href: "/forum/post/new",
                icon: <ArticleOutlinedIcon/> // document icon for creating post
            }
        ]
    },
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
            },
            {
                label: "Settings",
                href: "/settings",
                icon: <SettingsOutlinedIcon/> // gear icon for settings
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
