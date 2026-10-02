import React from "react";
import {useRouter} from "next/router";
import AuthContext from "@/services/AuthContext";
import useBlockstrings from "@/hooks/useBlockstrings";
import {BlockstringForm} from "@/src/components/blockstrings/BlockstringForm";
import {blockstringDetailToGraph} from "@/src/components/blockstrings/blockstringGraphDraft";
import {BlockstringStatusChip} from "@/src/components/blockstrings/BlockstringStatusChip";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {PressureGraphView} from "@/src/features/pressure-graph/PressureGraphView";
import type {BlockstringDetail, BlockstringPayload} from "@/src/types/blockstring";

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
            <PageShell title={item.title} badgeLabel={item.attackerCharacter?.name ?? undefined}>
                {error && editMode ? <InlineNotice severity="error">{error}</InlineNotice> : null}
                <AppBox sx={{display: "flex", flexDirection: {xs: "column", sm: "row"}, justifyContent: "space-between", gap: 1}}>
                    <AppBox sx={{display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center"}}>
                        <BlockstringStatusChip classification={item.classification} />
                    </AppBox>
                    {authContext.canModerate ? <AppButton type="button" variant="outlined" color="secondary" sx={{width: {xs: "100%", sm: "auto"}}} onClick={() => setEditMode((current) => !current)}>{editMode ? "Cancel Edit" : "Edit"}</AppButton> : null}
                </AppBox>

                {editMode ? <BlockstringForm initialValue={item} submitLabel="Save Blockstring" saving={saving} onSubmit={handleSubmit} /> : <BlockstringReadOnly item={item} />}
            </PageShell>
        </AppContainer>
    );
}

function BlockstringReadOnly({item}: {item: BlockstringDetail}) {
    const graph = React.useMemo(() => blockstringDetailToGraph(item), [item]);

    return (
        <AppBox sx={{display: "grid", gap: 1.2}}>
            {item.summary ? <InlineNotice severity={item.classification === "fake" || item.classification === "knowledge_check" ? "warning" : "info"}>{item.summary}</InlineNotice> : null}
            <PressureGraphView graph={graph} ariaLabel={`${item.title} graph`} />
            <DefenseNotes item={item} />
        </AppBox>
    );
}

function DefenseNotes({item}: {item: BlockstringDetail}) {
    const notationById = new Map(item.nodes.map((node) => [node.id, node.move?.numpadNotation ?? "?"]));
    const edgeById = new Map(item.edges.map((edge) => [edge.id, edge]));
    const notes = item.defenseEntries.filter((entry) => entry.instruction);

    if (notes.length === 0) {
        return null;
    }

    return (
        <AppBox sx={{display: "grid", gap: 0.75}}>
            <AppTypography variant="subtitle1" sx={{fontWeight: 820}}>How to beat it</AppTypography>
            {notes.map((entry) => {
                const edge = edgeById.get(entry.edgeId);
                return (
                    <AppPaper key={entry.id ?? `${entry.edgeId}-${entry.instruction}`} variant="outlined" sx={{p: 1, borderRadius: 1.5, display: "grid", gap: 0.25, backgroundColor: "fgc.surface.base"}}>
                        {edge ? (
                            <AppTypography variant="body2" sx={{fontWeight: 820}}>
                                {notationById.get(edge.from)} → {notationById.get(edge.to)}{edge.gapFrames !== null ? ` · ${edge.gapFrames}f gap` : ""}
                            </AppTypography>
                        ) : null}
                        <AppTypography variant="body2">{entry.instruction}</AppTypography>
                    </AppPaper>
                );
            })}
        </AppBox>
    );
}
