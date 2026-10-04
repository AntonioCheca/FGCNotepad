import type {UserRole} from "@/src/types/auth";

interface RouteAccessRule {
    prefix: string;
    allowedRoles: UserRole[];
}

const QA_ROLES: UserRole[] = ["ROLE_QA_TESTER", "ROLE_ADMIN"];
const MODERATION_ROLES: UserRole[] = ["ROLE_MODERATOR", "ROLE_ADMIN"];

// First matching prefix wins, so narrower paths must precede broader ones.
const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
    {prefix: "/replay-lab/shared", allowedRoles: []},
    {prefix: "/replay-lab", allowedRoles: QA_ROLES},
    {prefix: "/profile/recommend-combo", allowedRoles: QA_ROLES},
    {prefix: "/okis/reversals", allowedRoles: ["ROLE_ADMIN"]},
    {prefix: "/admin/situations", allowedRoles: MODERATION_ROLES},
    {prefix: "/admin", allowedRoles: ["ROLE_ADMIN"]},
    {prefix: "/moderation", allowedRoles: MODERATION_ROLES},
];

function matchesPrefix(pathname: string, prefix: string): boolean {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function canAccessRoute(pathname: string, roles: readonly string[]): boolean {
    const rule = ROUTE_ACCESS_RULES.find((candidate) => matchesPrefix(pathname, candidate.prefix));
    if (!rule || rule.allowedRoles.length === 0) {
        return true;
    }

    const grantedRoles = new Set(roles);

    return rule.allowedRoles.some((role) => grantedRoles.has(role));
}
