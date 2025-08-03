import { ListItemButton, ListItemText } from "@mui/material";
import Link from "next/link";
import { NavigationItem as NavigationItemType } from "@/src/types/navigation";

interface NavigationItemProps {
    item: NavigationItemType;
    isActive?: boolean;
}

export default function NavigationItem({ item, isActive = false }: NavigationItemProps) {
    return (
        <Link href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemButton
                sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 1,
                    mx: 1,
                    backgroundColor: isActive ? 'action.selected' : 'transparent',
                    '&:hover': {
                        backgroundColor: 'action.hover'
                    }
                }}
            >
                <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                        variant: 'body2',
                        color: isActive ? 'primary.main' : 'text.secondary',
                        fontWeight: isActive ? 600 : 400
                    }}
                />
            </ListItemButton>
        </Link>
    );
}
