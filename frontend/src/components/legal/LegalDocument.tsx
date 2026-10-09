import type {ReactNode} from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {LEGAL_LAST_UPDATED} from "@/src/data/legal/legalVersion";

interface LegalDocumentProps {
    title: string;
    children: ReactNode;
}

export function LegalDocument({title, children}: LegalDocumentProps) {
    return (
        <AppContainer maxWidth="md" sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3}}}>
            <PageShell title={title} badgeLabel={`Updated ${LEGAL_LAST_UPDATED}`}>
                <SectionCard>
                    <AppBox sx={{display: "grid", gap: {xs: 2.5, md: 3}, minWidth: 0, overflowWrap: "anywhere"}}>
                        {children}
                    </AppBox>
                </SectionCard>
            </PageShell>
        </AppContainer>
    );
}

interface LegalSectionProps {
    title: string;
    children: ReactNode;
}

export function LegalSection({title, children}: LegalSectionProps) {
    return (
        <AppBox component="section" sx={{display: "grid", gap: 1, minWidth: 0}}>
            <AppTypography variant="h6" component="h2">{title}</AppTypography>
            {children}
        </AppBox>
    );
}

export function LegalText({children}: {children: ReactNode}) {
    return (
        <AppTypography component="p" variant="body2" color="text.secondary" sx={{lineHeight: 1.7}}>
            {children}
        </AppTypography>
    );
}

export function LegalList({items}: {items: ReactNode[]}) {
    return (
        <AppBox component="ul" sx={{m: 0, pl: 2.5, display: "grid", gap: 0.75}}>
            {items.map((item, index) => (
                <AppTypography key={index} component="li" variant="body2" color="text.secondary" sx={{lineHeight: 1.7}}>
                    {item}
                </AppTypography>
            ))}
        </AppBox>
    );
}

export function LegalEmailLink({email}: {email: string}) {
    return (
        <a href={`mailto:${email}`}>
            <AppTypography component="span" variant="body2" sx={{color: (theme) => theme.fgc.action.primaryText, fontWeight: 600, overflowWrap: "anywhere"}}>
                {email}
            </AppTypography>
        </a>
    );
}
