import React from "react";
import {useRouter} from "next/router";
import AuthContext from "@/services/AuthContext";
import useBlockstrings from "@/hooks/useBlockstrings";
import {BlockstringForm} from "@/src/components/blockstrings/BlockstringForm";
import {blockstringTitle, blockToGraph} from "@/src/components/blockstrings/blockstringGraphDraft";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {PressureGraphView} from "@/src/features/pressure-graph/PressureGraphView";
import type {BlockstringBlock, BlockstringDetail, BlockstringPayload} from "@/src/types/blockstring";

export default function BlockstringDetailPage() {
    const router = useRouter();
    const authContext = React.useContext(AuthContext);
    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }
    const {id} = router.query;
    const blockstringId = typeof id === "string" ? id : null;
    const {getBlockstring, updateBlockstring} = useBlockstrings();
    const [item, setItem] = React.useState<BlockstringDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [editMode, setEditMode] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!blockstringId) {
            return;
        }
        let canceled = false;
        setLoading(true);
        setError(null);
        getBlockstring(blockstringId)
            .then((result: BlockstringDetail) => { if (!canceled) { setItem(result); setError(null); } })
            .catch(() => { if (!canceled) setError("Blockstring not found."); })
            .finally(() => { if (!canceled) setLoading(false); });
        return () => { canceled = true; };
    }, [blockstringId, getBlockstring]);

    const handleSubmit = async (payload: BlockstringPayload) => {
        if (!blockstringId) {
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const result = await updateBlockstring(blockstringId, payload);
            setItem(result);
            setEditMode(false);
        } catch {
            setError("Could not update blockstring.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <AppContainer sx={{py: 4}}><AppBox sx={{display: "grid", placeItems: "center", py: 5}}><AppCircularProgress /></AppBox></AppContainer>;
    }

    if (!item) {
        return <AppContainer sx={{py: 4}}><InlineNotice severity="error">{error ?? "Blockstring not found."}</InlineNotice></AppContainer>;
    }

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title={blockstringTitle(item)}>
                {error && editMode ? <InlineNotice severity="error">{error}</InlineNotice> : null}
                {authContext.canModerate ? (
                    <AppBox sx={{display: "flex", justifyContent: "flex-end"}}>
                        <AppButton type="button" variant="outlined" color="secondary" onClick={() => setEditMode((current) => !current)}>{editMode ? "Cancel edit" : "Edit"}</AppButton>
                    </AppBox>
                ) : null}

                {editMode ? <BlockstringForm initialValue={item} submitLabel="Save blockstring" saving={saving} onSubmit={handleSubmit} /> : <BlockstringBlocks item={item} />}
            </PageShell>
        </AppContainer>
    );
}

function BlockstringBlocks({item}: {item: BlockstringDetail}) {
    return (
        <AppBox sx={{display: "grid", gap: 1.5}}>
            {item.blocks.map((block, index) => <BlockView key={block.id} block={block} index={index} />)}
        </AppBox>
    );
}

// The description ("If they start mashing...") is the block's title; blocks without one show only their graph.
function BlockView({block, index}: {block: BlockstringBlock; index: number}) {
    const graph = React.useMemo(() => blockToGraph(block), [block]);

    return (
        <SectionCard title={block.description ?? undefined} tone="raised">
            <PressureGraphView graph={graph} ariaLabel={`${block.description ?? `Block ${index + 1}`} graph`} frameDetails />
        </SectionCard>
    );
}
