"use client";

import { Box, List, Divider } from "@mui/material";
import { AppTypography } from "@/src/components/ui/AppTypography";
import NavigationItem from "./NavigationItem";
import { NavigationSection as NavigationSectionType } from "@/src/types/navigation";
import { usePathname } from "next/navigation";

interface NavigationSectionProps {
    section: NavigationSectionType;
    showDivider?: boolean;
}

export default function NavigationSection({ section, showDivider = false }: NavigationSectionProps) {
    const pathname = usePathname();

    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ px: 2, mb: 1 }}>
                <AppTypography
                    variant="overline"
                    sx={{
                        fontWeight: 'bold',
                        color: 'text.primary',
                        fontSize: '0.75rem',
                        letterSpacing: 1.2
                    }}
                >
                    {section.title}
                </AppTypography>
            </Box>

            <List disablePadding>
                {section.items.map((item) => (
                    <NavigationItem
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                    />
                ))}
            </List>

            {showDivider && (
                <Divider sx={{ mx: 2, mt: 2 }} />
            )}
        </Box>
    );
}
