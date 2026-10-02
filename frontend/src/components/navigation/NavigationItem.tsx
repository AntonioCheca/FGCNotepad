import Link from "next/link";
import {NavigationItem as NavigationItemType} from "@/src/types/navigation";
import {AppListItem} from "@/src/components/ui/AppListItem";
import {AppListItemButton} from "@/src/components/ui/AppListItemButton";
import {AppListItemIcon} from "@/src/components/ui/AppListItemIcon";
import {AppListItemText} from "@/src/components/ui/AppListItemText";
import {AppTooltip} from "@/src/components/ui/AppTooltip";
import type {Theme} from "@/src/components/ui/AppThemeUtils";

interface NavigationItemProps {
    item: NavigationItemType;
    isActive?: boolean;
    collapsed?: boolean;
    onNavigate?: () => void;
}

export default function NavigationItem({item, isActive = false, collapsed = false, onNavigate}: NavigationItemProps) {
    const navButton = (
        <AppListItemButton
            sx={{
                px: {xs: 1.6, md: collapsed ? 1.25 : 1.6},
                py: 1,
                borderRadius: 2,
                mx: 1,
                my: 0.25,
                backgroundColor: isActive ? ((theme: Theme) => theme.fgc.surface.selected) : 'transparent',
                border: '1px solid',
                borderColor: isActive ? ((theme: Theme) => theme.fgc.accent.selected) : 'transparent',
                boxShadow: isActive ? 'inset 3px 0 0 0' : 'none',
                color: isActive ? ((theme: Theme) => theme.fgc.icon.primary) : 'text.primary',
                transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                    backgroundColor: (theme: Theme) => theme.fgc.surface.subtle,
                    borderColor: isActive ? ((theme: Theme) => theme.fgc.accent.selected) : ((theme: Theme) => theme.fgc.border.subtle),
                },
                justifyContent: {xs: 'flex-start', md: collapsed ? 'center' : 'flex-start'},
            }}
            selected={isActive}
        >
            <AppListItemIcon
                sx={{
                    minWidth: 0,
                    mr: {xs: 1.5, md: collapsed ? 0 : 1.5},
                    color: isActive ? ((theme: Theme) => theme.fgc.accent.selected) : ((theme: Theme) => theme.fgc.icon.muted),
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                {item.icon}
            </AppListItemIcon>

            <AppListItemText
                primary={item.label}
                sx={{display: {xs: 'block', md: collapsed ? 'none' : 'block'}}}
                primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: isActive ? 650 : 520,
                    lineHeight: 1.35,
                }}
            />
        </AppListItemButton>
    );

    return (
        <AppListItem disablePadding>
            <Link
                href={item.href}
                passHref
                onClick={onNavigate}
                style={{width: '100%', textDecoration: 'none', color: 'inherit'}}
            >
                {collapsed ? <AppTooltip title={item.label} placement="right">{navButton}</AppTooltip> : navButton}
            </Link>
        </AppListItem>
    );
}
