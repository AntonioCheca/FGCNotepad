import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppTypography} from "@/src/components/ui/AppTypography";

interface NeutralRequestStatusProps {
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

/** Compact request state shown beside the filters; the last rendered graphs stay in place meanwhile. */
export function NeutralRequestStatus({loading, error, onRetry}: NeutralRequestStatusProps) {
    if (!loading && error === null) {
        return null;
    }

    return (
        <AppBox role="status" aria-live="polite" sx={{display: "flex", alignItems: "center", gap: 0.75, minHeight: 24, flexWrap: "wrap"}}>
            {loading ? <AppCircularProgress size={14} aria-label="Updating stats"/> : null}
            {error !== null && !loading ? (
                <>
                    <AppTypography variant="caption" color="error.main">{error}</AppTypography>
                    <AppButton size="small" variant="text" color="secondary" onClick={onRetry} sx={{minHeight: 28, py: 0}}>Retry</AppButton>
                </>
            ) : null}
            {loading ? <AppTypography variant="caption" color="text.secondary">Updating…</AppTypography> : null}
        </AppBox>
    );
}
