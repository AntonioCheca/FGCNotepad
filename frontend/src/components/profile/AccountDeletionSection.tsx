"use client";

import React from "react";
import AuthContext from "@/services/AuthContext";
import {useAccount} from "@/hooks/useAccount";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppDialog} from "@/src/components/ui/AppDialog";
import {AppDialogActions} from "@/src/components/ui/AppDialogActions";
import {AppDialogContent} from "@/src/components/ui/AppDialogContent";
import {AppDialogTitle} from "@/src/components/ui/AppDialogTitle";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

function extractErrorMessage(error: unknown): string {
    const message = (error as {response?: {data?: {message?: unknown}}})?.response?.data?.message;

    return typeof message === "string" ? message : "Could not request account deletion. Try again.";
}

export default function AccountDeletionSection() {
    const authContext = React.useContext(AuthContext);
    const {requestAccountDeletion} = useAccount();
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const confirmDeletion = async () => {
        setSubmitting(true);
        setError(null);
        try {
            await requestAccountDeletion();
            authContext?.endSession();
        } catch (requestError) {
            setError(extractErrorMessage(requestError));
            setSubmitting(false);
        }
    };

    return (
        <SectionCard title="Account">
            <AppButton type="button" variant="outlined" color="error" onClick={() => setConfirmOpen(true)} sx={{width: {xs: "100%", sm: "auto"}, justifySelf: "start", minHeight: 44}}>
                Request Account Deletion
            </AppButton>

            <AppDialog open={confirmOpen} onClose={() => (submitting ? undefined : setConfirmOpen(false))} maxWidth="xs" fullWidth aria-labelledby="account-deletion-title">
                <AppDialogTitle id="account-deletion-title">Delete your account?</AppDialogTitle>
                <AppDialogContent sx={{display: "grid", gap: 1.5}}>
                    <AppTypography variant="body2" color="text.secondary">
                        Your account is deactivated now and you are logged out. Within one month we delete your account data.
                        Published contributions stay on the site without your username.
                    </AppTypography>
                    {error ? <AppAlert severity="error">{error}</AppAlert> : null}
                </AppDialogContent>
                <AppDialogActions sx={{px: 3, pb: 2, gap: 1, flexWrap: "wrap"}}>
                    <AppButton type="button" variant="outlined" disabled={submitting} onClick={() => setConfirmOpen(false)} sx={{minHeight: 44}}>
                        Cancel
                    </AppButton>
                    <AppButton type="button" color="error" disabled={submitting} onClick={() => void confirmDeletion()} sx={{minHeight: 44}}>
                        {submitting ? "Requesting..." : "Delete Account"}
                    </AppButton>
                </AppDialogActions>
            </AppDialog>
        </SectionCard>
    );
}
