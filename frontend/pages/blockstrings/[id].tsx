import React from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import AuthContext from "@/services/AuthContext";
import useBlockstrings from "@/hooks/useBlockstrings";
import {BlockstringForm} from "@/src/components/blockstrings/BlockstringForm";
import {BlockstringStatusChip} from "@/src/components/blockstrings/BlockstringStatusChip";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import type {BlockstringDetail, BlockstringPayload} from "@/src/types/blockstring";
import {formatBlockstringLabel} from "@/src/types/blockstring";

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
        getBlockstring(blockstringId)
            .then((result: BlockstringDetail) => { if (!canceled) setItem(result); })
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
                {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}
                <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap"}}>
                    <AppBox sx={{display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center"}}>
                        <BlockstringStatusChip classification={item.classification} />
                        <AppTypography variant="body2" color="text.secondary">{item.notation}</AppTypography>
                    </AppBox>
                    {authContext.canModerate ? <AppButton type="button" variant="outlined" color="secondary" onClick={() => setEditMode((current) => !current)}>{editMode ? "Cancel Edit" : "Edit"}</AppButton> : null}
                </AppBox>

                {editMode ? <BlockstringForm initialValue={item} submitLabel="Save Blockstring" saving={saving} onSubmit={handleSubmit} /> : <BlockstringReadOnly item={item} />}
            </PageShell>
        </AppContainer>
    );
}

function BlockstringReadOnly({item}: {item: BlockstringDetail}) {
    return (
        <AppBox sx={{display: "grid", gap: 1.2}}>
            {item.summary ? <InlineNotice severity={item.classification === "fake" || item.classification === "knowledge_check" ? "warning" : "info"}>{item.summary}</InlineNotice> : null}
            <AppPaper variant="outlined" sx={{p: 1.5, borderRadius: 2.5, backgroundColor: "fgc.surface.base", display: "grid", gap: 1}}>
                <AppTypography variant="h6">Defensive Answer</AppTypography>
                <AppTypography variant="body2">{item.maxInterruptStartup === null ? "Open the entries below for the specific answer." : `Use ${item.maxInterruptStartup}f or faster after step ${item.gapAfterStep ?? "?"}.`}</AppTypography>
                {item.defenseEntries.map((entry) => (
                    <AppBox key={entry.id ?? entry.instruction} sx={{display: "grid", gap: 0.5, borderTop: "1px solid", borderColor: "fgc.border.default", pt: 1}}>
                        {entry.instruction ? <AppTypography variant="body2">{entry.instruction}</AppTypography> : null}
                        {entry.answers.map((answer) => <AppTypography key={answer.id ?? answer.conversion} variant="body2" color="text.secondary">{formatBlockstringLabel(answer.responseType)} · {answer.move?.numpadNotation ?? `${answer.startupFrames ?? "?"}f`} · {formatBlockstringLabel(answer.outcome)}{answer.conversion ? ` · ${answer.conversion}` : ""}</AppTypography>)}
                    </AppBox>
                ))}
            </AppPaper>
            <AppPaper variant="outlined" sx={{p: 1.5, borderRadius: 2.5, backgroundColor: "fgc.surface.base", display: "grid", gap: 1}}>
                <AppTypography variant="h6">Offensive Plans</AppTypography>
                {item.offensePlans.length === 0 ? <AppTypography variant="body2" color="text.secondary">No offensive plans documented.</AppTypography> : item.offensePlans.map((plan) => (
                    <AppBox key={plan.id ?? plan.label} sx={{display: "grid", gap: 0.4, borderTop: "1px solid", borderColor: "fgc.border.default", pt: 1}}>
                        <AppTypography variant="subtitle1" sx={{fontWeight: 800}}>{plan.label}</AppTypography>
                        {plan.targetBehavior ? <AppTypography variant="body2" color="text.secondary">Targets: {plan.targetBehavior}</AppTypography> : null}
                        {plan.purpose ? <AppTypography variant="body2">{plan.purpose}</AppTypography> : null}
                        <AppBox sx={{display: "flex", gap: 1, flexWrap: "wrap"}}>
                            {plan.onHit ? <AppTypography variant="caption">Hit: {plan.onHit}</AppTypography> : null}
                            {plan.onBlock ? <AppTypography variant="caption">Block: {plan.onBlock}</AppTypography> : null}
                            {plan.losesTo ? <AppTypography variant="caption">Loses to: {plan.losesTo}</AppTypography> : null}
                        </AppBox>
                    </AppBox>
                ))}
            </AppPaper>
            <AppBox sx={{display: "flex", gap: 1, flexWrap: "wrap"}}>
                <Link href="/blockstrings/offense" style={{textDecoration: "none"}}><AppButton type="button" variant="outlined" color="secondary">Offense Search</AppButton></Link>
                <Link href="/blockstrings/defense" style={{textDecoration: "none"}}><AppButton type="button" variant="outlined" color="secondary">Defense Search</AppButton></Link>
            </AppBox>
        </AppBox>
    );
}
