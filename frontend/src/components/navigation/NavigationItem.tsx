import {
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText
} from "@mui/material";
import Link from "next/link";
import {NavigationItem as NavigationItemType} from "@/src/types/navigation";

interface NavigationItemProps {
    item: NavigationItemType;
    isActive?: boolean;
    collapsed?: boolean;
}

export default function NavigationItem({item, isActive = false, collapsed = false}: NavigationItemProps) {
    return (
        <ListItem disablePadding>
            <Link
                href={item.href}
                passHref
                style={{width: '100%', textDecoration: 'none', color: 'inherit'}}
            >
                <ListItemButton
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
                    <ListItemIcon
                        sx={{
                            minWidth: 0,
                            mr: collapsed ? 0 : 2,
                            color: isActive ? 'primary.main' : 'text.secondary',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        {item.icon}
                    </ListItemIcon>

                    {!collapsed && (
                        <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                                variant: 'body2',
                                fontWeight: isActive ? 600 : 400,
                            }}
                        />
                    )}
                </ListItemButton>
            </Link>
        </ListItem>
    );
}
