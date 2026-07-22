import type {ReactNode} from "react";
import Link from "next/link";
import {AppTypography} from "@/src/components/ui/AppTypography";

interface TextLinkProps {
    href: string;
    children: ReactNode;
}

export function TextLink({href, children}: TextLinkProps) {
    return (
        <>
            {" "}
            <Link href={href} target="_blank" rel="noreferrer" style={{textDecoration: "none"}}>
                <AppTypography
                    component="span"
                    sx={{
                        color: (theme) => theme.fgc.action.primary,
                        fontWeight: 600,
                        textDecoration: "underline",
                        "&:hover": {color: (theme) => theme.fgc.action.primaryHover},
                    }}
                >
                    {children}
                </AppTypography>
            </Link>
        </>
    );
}
