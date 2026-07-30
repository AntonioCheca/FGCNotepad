import React from "react";
import {useRouter} from "next/router";
import useOkis from "@/hooks/useOkis";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {OkiEditorForm} from "@/src/components/okis/OkiEditorForm";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import type {OkiProfileDetail} from "@/src/types/oki";

export default function EditOkiPage() {
    const router = useRouter();
    const {id} = router.query;
    const {getOki} = useOkis();
    const [profile, setProfile] = React.useState<OkiProfileDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (typeof id !== "string") {
            return;
        }
        let canceled = false;
        setLoading(true);
        getOki(id)
            .then((result) => {
                if (!canceled) {
                    setProfile(result);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setError("Could not load oki profile.");
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
        return <AppContainer sx={{py: 4}}><InlineNotice severity="error">{error ?? "Oki profile not found."}</InlineNotice></AppContainer>;
    }

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title={`Edit Oki: ${profile.move.numpadNotation}`}>
                <OkiEditorForm mode="edit" initialProfile={profile} />
            </PageShell>
        </AppContainer>
    );
}
