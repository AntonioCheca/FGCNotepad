import {NavigationSection} from "@/src/types/navigation";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SportsMartialArtsOutlinedIcon from '@mui/icons-material/SportsMartialArtsOutlined';
import SportsKabaddiOutlinedIcon from '@mui/icons-material/SportsKabaddiOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import {SportsMma} from "@mui/icons-material";

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
                icon: <SportsMma/> // related but distinct sports icon
            },
            {
                label: "Create Combo",
                href: "/combos/new",
                icon: <SportsMartialArtsOutlinedIcon/> // main combos icon
            }
        ]
    },
    {
        title: "Account",
        items: [
            {
                label: "Profile",
                href: "/profile",
                icon: <AccountCircleOutlinedIcon/> // user icon for profile
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
