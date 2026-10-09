import {AdminUserRole} from "@/src/types/adminUsers";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";

export type RolePreset = "user" | "qaTester" | "moderator" | "moderatorQaTester" | "admin";

export const ROLE_PRESET_TO_ROLES: Record<RolePreset, AdminUserRole[]> = {
    user: ["ROLE_USER"],
    qaTester: ["ROLE_QA_TESTER", "ROLE_USER"],
    moderator: ["ROLE_MODERATOR", "ROLE_USER"],
    moderatorQaTester: ["ROLE_MODERATOR", "ROLE_QA_TESTER", "ROLE_USER"],
    admin: ["ROLE_ADMIN", "ROLE_USER"],
};

const ROLE_PRESET_LABELS: Record<RolePreset, string> = {
    user: "User",
    qaTester: "QA Tester",
    moderator: "Moderator",
    moderatorQaTester: "Moderator + QA Tester",
    admin: "Admin",
};

export function hasRole(roles: string[], role: AdminUserRole): boolean {
    return roles.includes(role);
}

export function rolePresetFromRoles(roles: string[]): RolePreset {
    if (hasRole(roles, "ROLE_ADMIN")) {
        return "admin";
    }

    const isQaTester = hasRole(roles, "ROLE_QA_TESTER");
    if (hasRole(roles, "ROLE_MODERATOR")) {
        return isQaTester ? "moderatorQaTester" : "moderator";
    }

    return isQaTester ? "qaTester" : "user";
}

export const roleMenuItems = (Object.keys(ROLE_PRESET_LABELS) as RolePreset[]).map((preset) => (
    <AppMenuItem key={preset} value={preset}>{ROLE_PRESET_LABELS[preset]}</AppMenuItem>
));
