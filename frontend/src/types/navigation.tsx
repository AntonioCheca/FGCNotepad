import {JSX} from "react";

export interface NavigationItem {
    label: string;
    href: string;
    icon?: JSX.Element;
    requiresAuth?: boolean;
}

export interface NavigationSection {
    title: string;
    items: NavigationItem[];
}
