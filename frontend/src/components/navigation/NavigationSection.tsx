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
    onNavigate?: () => void;
}

export default function NavigationSection({section, showDivider = false, collapsed = false, onNavigate}: NavigationSectionProps) {
    const pathname = usePathname();

    return (
        <AppBox sx={{mb: 1.35}}>
            <AppBox sx={{px: 2.35, mb: 0.35, display: {xs: 'block', md: collapsed ? 'none' : 'block'}}}>
                <AppTypography
                    variant="overline"
                    sx={{
                        fontWeight: 700,
                        color: 'fgc.text.muted',
                        fontSize: '0.66rem',
                        letterSpacing: 1.3,
                    }}
                >
                    {section.title}
                </AppTypography>
            </AppBox>

            <AppList disablePadding>
                {section.items.map((item) => (
                    <NavigationItem
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                    />
                ))}
            </AppList>

            {showDivider && (
                <AppDivider sx={{mx: 2.1, mt: 1.2, borderColor: 'fgc.border.subtle'}}/>
            )}
        </AppBox>
    );
}
