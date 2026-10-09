import React from "react";
import AuthContext from "@/services/AuthContext";
import {NavigationSection} from "@/src/types/navigation";

export function useVisibleNavigationSections(sections: NavigationSection[]): NavigationSection[] {
    const authContext = React.useContext(AuthContext);

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {isAuthenticated, hasRole} = authContext;

    return React.useMemo(() => {
        const visibleSections: NavigationSection[] = [];
        for (const section of sections) {
            const items = section.items.filter((item) => {
                if ((item.requiresAuth && !isAuthenticated) || (item.guestOnly && isAuthenticated)) {
                    return false;
                }

                if (!item.allowedRoles || item.allowedRoles.length === 0) {
                    return true;
                }

                return item.allowedRoles.some((role) => hasRole(role));
            });

            if (items.length > 0) {
                visibleSections.push({...section, items});
            }
        }

        return visibleSections;
    }, [sections, hasRole, isAuthenticated]);
}
