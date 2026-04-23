"use client";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppList} from "@/src/components/ui/AppList";
import {AppDivider} from "@/src/components/ui/AppDivider";
import {AppTypography} from "@/src/components/ui/AppTypography";
import NavigationItem from "./NavigationItem";
import {NavigationSection as NavigationSectionType} from "@/src/types/navigation";
import {usePathname} from "next/navigation";

interface NavigationSectionProps {
    section: NavigationSectionType;
    showDivider?: boolean;
    collapsed: boolean;
}

export default function NavigationSection({section, showDivider = false, collapsed = false}: NavigationSectionProps) {
    const pathname = usePathname();

    return (
        <AppBox sx={{mb: 1.5}}>
            {!collapsed ? (
                <AppBox sx={{px: 2.5, mb: 0.5}}>
                    <AppTypography
                        variant="overline"
                        sx={{
                            fontWeight: 700,
                            color: 'text.secondary',
                            fontSize: '0.66rem',
                            letterSpacing: 1.3,
                        }}
                    >
                        {section.title}
                    </AppTypography>
                </AppBox>
            ) : null}

            <AppList disablePadding>
                {section.items.map((item) => (
                    <NavigationItem
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                        collapsed={collapsed}
                    />
                ))}
            </AppList>

            {showDivider && (
                <AppDivider sx={{mx: 2, mt: 1.5}}/>
            )}
        </AppBox>
    );
}
