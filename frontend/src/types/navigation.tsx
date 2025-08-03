export interface NavigationItem {
    label: string;
    href: string;
    icon?: string;
}

export interface NavigationSection {
    title: string;
    items: NavigationItem[];
}
