import Link from "next/link";
import {NavigationItem as NavigationItemType} from "@/src/types/navigation";
import {AppListItem} from "@/src/components/ui/AppListItem";
import {AppListItemButton} from "@/src/components/ui/AppListItemButton";
import {AppListItemIcon} from "@/src/components/ui/AppListItemIcon";
import {AppListItemText} from "@/src/components/ui/AppListItemText";

interface NavigationItemProps {
    item: NavigationItemType;
    isActive?: boolean;
    collapsed?: boolean;
}

export default function NavigationItem({item, isActive = false, collapsed = false}: NavigationItemProps) {
    return (
        <AppListItem disablePadding>
            <Link
                href={item.href}
                passHref
                style={{width: '100%', textDecoration: 'none', color: 'inherit'}}
            >
                <AppListItemButton
                    sx={{
                        px: collapsed ? 2 : 3, // tighter padding when collapsed
                        py: 1,
                        borderRadius: 1,
                        mx: 1,
                        backgroundColor: isActive ? 'action.selected' : 'transparent',
                        '&:hover': {
                            backgroundColor: 'action.hover'
                        },
                        justifyContent: collapsed ? 'center' : 'flex-start', // center icon when collapsed
                    }}
                    selected={isActive}
                >
                    <AppListItemIcon
                        sx={{
                            minWidth: 0,
                            mr: collapsed ? 0 : 2,
                            color: isActive ? 'primary.main' : 'text.secondary',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        {item.icon}
                    </AppListItemIcon>

                    {!collapsed && (
                        <AppListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                                variant: 'body2',
                                fontWeight: isActive ? 600 : 400,
                            }}
                        />
                    )}
                </AppListItemButton>
            </Link>
        </AppListItem>
    );
}
