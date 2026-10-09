import React from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import useOkis from "@/hooks/useOkis";
import AuthContext from "@/services/AuthContext";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {OkiMoveRef, OkiProfileDetail, OkiSetup} from "@/src/types/oki";
import {okiSetupToGraph, okiTitle} from "@/src/components/okis/okiEditorTypes";
import {PressureGraphView} from "@/src/features/pressure-graph/PressureGraphView";

export default function OkiDetailPage() {
    const router = useRouter();
    const {id} = router.query;
    const {getOki} = useOkis();
    const isAuthenticated = React.useContext(AuthContext)?.isAuthenticated ?? false;
    const [profile, setProfile] = React.useState<OkiProfileDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (typeof id !== "string") {
            return;
        }
        let canceled = false;
        setLoading(true);
        setError(null);
        getOki(id)
            .then((result) => {
                if (!canceled) {
                    setProfile(result);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setError("Could not load oki.");
                }
            })
            .finally(() => {
                if (!canceled) {
                    setLoading(false);
                }
            });
        return () => { canceled = true; };
    }, [getOki, id]);

    if (loading) {
        return <AppContainer sx={{py: 4, display: "grid", placeItems: "center"}}><AppCircularProgress /></AppContainer>;
    }

    if (error || !profile) {
        return <AppContainer sx={{py: 4}}><InlineNotice severity="error">{error ?? "Oki not found."}</InlineNotice></AppContainer>;
    }

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title={okiTitle(profile.move)}>
                {isAuthenticated ? (
                    <AppBox sx={{display: "flex", justifyContent: "flex-end"}}>
                        <Link href={`/okis/${profile.id}/edit`} style={{textDecoration: "none"}}><AppButton type="button" variant="outlined" color="secondary">Edit oki</AppButton></Link>
                    </AppBox>
                ) : null}

                {profile.setups.map((setup) => <SetupCard key={setup.id} setup={setup} ender={profile.move} />)}
            </PageShell>
        </AppContainer>
    );
}

function SetupCard({setup, ender}: {setup: OkiSetup; ender: OkiMoveRef}) {
    const graph = React.useMemo(() => okiSetupToGraph(setup, ender), [ender, setup]);
    const conditions = [setup.cornerOnly ? "Corner only" : null, setup.backrollDependent ? "Backroll dependent" : null].filter((condition): condition is string => condition !== null);

    return (
        <SectionCard title={setup.name} description={conditions.join(" · ") || undefined} tone="raised">
            {setup.moderationState !== "approved" ? (
                <InlineNotice severity={setup.moderationState === "pending_review" ? "info" : "warning"}>
                    {setup.moderationState === "pending_review" ? "Pending moderation. Only you and moderators can see this setup." : `${setup.moderationState === "rejected" ? "Rejected" : "Hidden"}${setup.moderationReason ? `: ${setup.moderationReason}` : "."}`}
                </InlineNotice>
            ) : null}

            <PressureGraphView graph={graph} ariaLabel={`${setup.name} graph`} />
        </SectionCard>
    );
}
