"use client";

import React from "react";
import {useRouter} from "next/router";
import AuthContext from "@/services/AuthContext";
import {useAccount} from "@/hooks/useAccount";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppDialog} from "@/src/components/ui/AppDialog";
import {AppDialogActions} from "@/src/components/ui/AppDialogActions";
import {AppDialogContent} from "@/src/components/ui/AppDialogContent";
import {AppDialogTitle} from "@/src/components/ui/AppDialogTitle";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {TextLink} from "@/src/components/ui/TextLink";

const LEGAL_ROUTES = new Set(["/privacy", "/terms"]);

export default function TermsAcceptanceDialog() {
    const authContext = React.useContext(AuthContext);
    const router = useRouter();
    const {acceptCurrentTerms} = useAccount();
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const user = authContext?.user ?? null;
    const open = user !== null && !user.hasAcceptedCurrentTerms && !LEGAL_ROUTES.has(router.pathname);

    const accept = async () => {
        setSubmitting(true);
        setError(null);
        try {
            authContext?.updateUser(await acceptCurrentTerms());
        } catch {
            setError("Could not save your acceptance. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppDialog open={open} maxWidth="xs" fullWidth aria-labelledby="terms-acceptance-title">
            <AppDialogTitle id="terms-acceptance-title">Updated Terms of Use</AppDialogTitle>
            <AppDialogContent sx={{display: "grid", gap: 1.5}}>
                <AppTypography variant="body2" color="text.secondary">
                    To keep using your account, confirm that you are at least 16 and accept the
                    <TextLink href="/terms">Terms of Use</TextLink>. How we handle your data is explained in the
                    <TextLink href="/privacy">Privacy Policy</TextLink>.
                </AppTypography>
                {error ? <AppAlert severity="error">{error}</AppAlert> : null}
            </AppDialogContent>
            <AppDialogActions sx={{px: 3, pb: 2, gap: 1, flexWrap: "wrap"}}>
                <AppButton type="button" variant="outlined" disabled={submitting} onClick={() => void authContext?.logout()} sx={{minHeight: 44}}>
                    Log Out
                </AppButton>
                <AppButton type="button" disabled={submitting} onClick={() => void accept()} sx={{minHeight: 44}}>
                    {submitting ? "Saving..." : "I Am 16+ and Accept"}
                </AppButton>
            </AppDialogActions>
        </AppDialog>
    );
}
