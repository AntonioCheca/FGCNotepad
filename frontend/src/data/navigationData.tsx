import {NavigationSection} from "@/src/types/navigation";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // ← Add this
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import SportsMartialArtsOutlinedIcon from '@mui/icons-material/SportsMartialArtsOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';


export const navigationSections: NavigationSection[] = [
    {
        title: "Posts",
        items: [
            {
                label: "Search Posts",
                href: "/home",
                icon: <ArticleOutlinedIcon/>
            },
            {
                label: "Create Post",
                href: "/forum/post/new",
                icon: <ArticleOutlinedIcon/>
            }
        ]
    },
    {
        title: "Combos",
        items: [
            {
                label: "Search Combos",
                href: "/combos",
                icon: <SportsMartialArtsOutlinedIcon/>
            },
            {
                label: "Create Combo",
                href: "/combos/new",
                icon: <SportsMartialArtsOutlinedIcon/>
            }
        ]
    },
    {
        title: "Account",
        items: [
            {
                label: "Profile",
                href: "/profile",
                icon: <AccountCircleOutlinedIcon/>
            },
            {
                label: "Settings",
                href: "/settings",
                icon: <AccountCircleOutlinedIcon/>
            }
        ]
    },
    {
        title: "About",
        items: [
            {
                label: "About Us",
                href: "/about/aboutUs",
                icon: <InfoOutlinedIcon/>
            }
        ]
    }
];

