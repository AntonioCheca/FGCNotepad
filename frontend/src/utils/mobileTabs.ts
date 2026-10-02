import type {MobileTab} from "@/src/types/navigation";

function matchesPrefix(pathname: string, prefix: string): boolean {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

// Returns the tab to highlight, or null when the page belongs to the "More" sheet.
export function findActiveMobileTab(pathname: string, tabs: MobileTab[]): MobileTab | null {
    return tabs.find((tab) => pathname === tab.href || tab.activePrefixes.some((prefix) => matchesPrefix(pathname, prefix))) ?? null;
}
