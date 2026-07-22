import type {ReactNode} from "react";
import {AppTypography} from "@/src/components/ui/AppTypography";

interface NormalParagraphProps {
    children: ReactNode;
    last?: boolean;
}

export function NormalParagraph({children, last = false}: NormalParagraphProps) {
    return (
        <AppTypography component="p" variant="body1" color="text.secondary" sx={{lineHeight: 1.7, mb: last ? 0 : 2}}>
            {children}
        </AppTypography>
    );
}
