import React from "react";
import Link from "next/link";

import AuthContext from "@/services/AuthContext";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppTooltip} from "@/src/components/ui/AppTooltip";

interface CreateContentLinkProps {
    href: string;
    label: string;
    variant?: "contained" | "outlined";
    color?: "primary" | "secondary";
    buttonSx?: React.ComponentProps<typeof AppButton>["sx"];
    linkStyle?: React.CSSProperties;
}

const ACCOUNT_REQUIRED_MESSAGE = "You need an account to create content. Registration is invite-only during the alpha.";

export function CreateContentLink({href, label, variant = "contained", color = "primary", buttonSx, linkStyle}: CreateContentLinkProps) {
    const isAuthenticated = React.useContext(AuthContext)?.isAuthenticated ?? false;
    const button = (
        <AppButton type="button" variant={variant} color={color} disabled={!isAuthenticated} sx={buttonSx}>
            {label}
        </AppButton>
    );

    if (isAuthenticated) {
        return <Link href={href} style={{textDecoration: "none", ...linkStyle}}>{button}</Link>;
    }

    return (
        <AppTooltip title={ACCOUNT_REQUIRED_MESSAGE}>
            <AppBox component="span" tabIndex={0} aria-label={`${label}: ${ACCOUNT_REQUIRED_MESSAGE}`} sx={{display: "inline-flex", ...linkStyle}}>
                {button}
            </AppBox>
        </AppTooltip>
    );
}
