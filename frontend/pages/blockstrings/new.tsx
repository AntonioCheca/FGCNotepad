import React from "react";
import {useRouter} from "next/router";
import useBlockstrings from "@/hooks/useBlockstrings";
import {BlockstringForm} from "@/src/components/blockstrings/BlockstringForm";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import type {BlockstringPayload} from "@/src/types/blockstring";

export default function CreateBlockstringPage() {
    const router = useRouter();
    const {createBlockstring} = useBlockstrings();
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = async (payload: BlockstringPayload) => {
        setSaving(true);
        setError(null);
        try {
            const result = await createBlockstring(payload);
            await router.push(`/blockstrings/${result.id}`);
        } catch {
            setError("Could not create blockstring.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Create Blockstring">
                {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}
                <BlockstringForm submitLabel="Create Blockstring" saving={saving} onSubmit={handleSubmit} />
            </PageShell>
        </AppContainer>
    );
}
