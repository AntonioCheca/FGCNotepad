import {JSX} from "react";
import {UserRole} from "@/src/types/auth";

export interface NavigationItem {
    label: string;
    href: string;
    icon?: JSX.Element;
    requiresAuth?: boolean;
    allowedRoles?: UserRole[];
}

export interface NavigationSection {
    title: string;
    items: NavigationItem[];
}
