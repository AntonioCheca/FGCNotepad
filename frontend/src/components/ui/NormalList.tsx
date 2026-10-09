import type {ReactNode} from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTypography} from "@/src/components/ui/AppTypography";

interface NormalListProps {
    children: ReactNode;
    last?: boolean;
}

export function NormalList({children, last = false}: NormalListProps) {
    return (
        <AppBox component="ul" sx={{m: 0, mb: last ? 0 : 2, pl: 3, display: "grid", gap: 1}}>
            {children}
        </AppBox>
    );
}

export function NormalListItem({children}: {children: ReactNode}) {
    return (
        <AppTypography component="li" variant="body1" color="text.secondary" sx={{lineHeight: 1.7}}>
            {children}
        </AppTypography>
    );
}
