import Link from "next/link";
import {NavigationItem as NavigationItemType} from "@/src/types/navigation";
import {AppListItem} from "@/src/components/ui/AppListItem";
import {AppListItemButton} from "@/src/components/ui/AppListItemButton";
import {AppListItemIcon} from "@/src/components/ui/AppListItemIcon";
import {AppListItemText} from "@/src/components/ui/AppListItemText";
import {AppTooltip} from "@/src/components/ui/AppTooltip";

interface NavigationItemProps {
    item: NavigationItemType;
    isActive?: boolean;
    collapsed?: boolean;
}

export default function NavigationItem({item, isActive = false, collapsed = false}: NavigationItemProps) {
    const navButton = (
        <AppListItemButton
            sx={{
                px: collapsed ? 1.25 : 1.75,
                py: 1.1,
                borderRadius: 2,
                mx: 1,
                my: 0.25,
                backgroundColor: isActive ? 'action.selected' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'divider' : 'transparent',
                transition: 'background-color 0.2s ease, border-color 0.2s ease',
                '&:hover': {
                    backgroundColor: 'action.hover',
                },
                justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            selected={isActive}
        >
            <AppListItemIcon
                sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 1.5,
                    color: isActive ? 'secondary.main' : 'text.secondary',
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                {item.icon}
            </AppListItemIcon>

            {!collapsed ? (
                <AppListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: isActive ? 600 : 500,
                        lineHeight: 1.35,
                    }}
                />
            ) : null}
        </AppListItemButton>
    );

    return (
        <AppListItem disablePadding>
            <Link
                href={item.href}
                passHref
                style={{width: '100%', textDecoration: 'none', color: 'inherit'}}
            >
                {collapsed ? <AppTooltip title={item.label} placement="right">{navButton}</AppTooltip> : navButton}
            </Link>
        </AppListItem>
    );
}
