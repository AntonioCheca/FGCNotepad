import React from "react";
import Link from "next/link";
import {useCharacters} from "@/hooks/useCharacters";
import useBlockstrings from "@/hooks/useBlockstrings";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {OkiMovePicker, type OkiMoveOption} from "@/src/components/okis/OkiMovePicker";
import {BlockstringStatusChip} from "@/src/components/blockstrings/BlockstringStatusChip";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import type {BlockstringSummary} from "@/src/types/blockstring";

export default function BlockstringOffensePage() {
    const {characters} = useCharacters();
    const {listBlockstrings} = useBlockstrings();
    const [q, setQ] = React.useState("");
    const [attackerCharacterId, setAttackerCharacterId] = React.useState("");
    const [move, setMove] = React.useState<OkiMoveOption | null>(null);
    const [items, setItems] = React.useState<BlockstringSummary[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let canceled = false;
        const handle = window.setTimeout(() => {
            setLoading(true);
            setError(null);
            listBlockstrings({q: q || undefined, attackerCharacterId: attackerCharacterId || undefined, moveId: move?.id})
                .then((result: BlockstringSummary[]) => { if (!canceled) setItems(result ?? []); })
                .catch(() => { if (!canceled) setError("Could not load offensive plans."); })
                .finally(() => { if (!canceled) setLoading(false); });
        }, 220);
        return () => { canceled = true; window.clearTimeout(handle); };
    }, [attackerCharacterId, listBlockstrings, move?.id, q]);

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Blockstring Offense" badgeLabel={`${items.length} plan${items.length === 1 ? "" : "s"}`}>
                {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}
                <AppPaper variant="outlined" sx={{p: 1.4, borderRadius: 2.5, display: "grid", gap: 1, backgroundColor: "fgc.surface.base"}}>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 220px 1fr auto"}, gap: 1, alignItems: "center"}}>
                        <AppTextField size="small" label="Search pressure" value={q} onChange={(event) => setQ(event.target.value)} />
                        <AppFormControl size="small">
                            <AppInputLabel id="offense-character-label">Character</AppInputLabel>
                            <AppSelect<string> labelId="offense-character-label" label="Character" value={attackerCharacterId} onChange={(event) => setAttackerCharacterId(String(event.target.value))}>
                                <AppMenuItem value="">Any</AppMenuItem>
                                {(characters as Array<{id: string; name: string}>).map((character) => <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>)}
                            </AppSelect>
                        </AppFormControl>
                        <OkiMovePicker label="Starting move" value={move} characterId={attackerCharacterId || undefined} onChange={setMove} />
                        <Link href="/blockstrings/new" style={{textDecoration: "none"}}><AppButton type="button" variant="contained" color="primary">Create</AppButton></Link>
                    </AppBox>
                </AppPaper>

                {loading ? <AppBox sx={{display: "grid", placeItems: "center", py: 4}}><AppCircularProgress /></AppBox> : <OffenseResults items={items} />}
            </PageShell>
        </AppContainer>
    );
}

function OffenseResults({items}: {items: BlockstringSummary[]}) {
    if (items.length === 0) {
        return <InlineNotice severity="info">No offensive blockstring plans match these filters.</InlineNotice>;
    }

    return (
        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", lg: "1fr 1fr"}, gap: 1}}>
            {items.map((item) => (
                <AppPaper key={item.id} variant="outlined" sx={{p: 1.4, borderRadius: 2.5, backgroundColor: "fgc.surface.base", display: "grid", gap: 0.75}}>
                    <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, alignItems: "start"}}>
                        <Link href={`/blockstrings/${item.id}`} style={{color: "inherit", textDecoration: "none"}}><AppTypography variant="h6" sx={{fontWeight: 800}}>{item.title}</AppTypography></Link>
                        <BlockstringStatusChip classification={item.classification} />
                    </AppBox>
                    <AppTypography variant="body2" color="text.secondary">{item.attackerCharacter?.name ?? "Unknown"} · {item.notation}</AppTypography>
                    {item.summary ? <AppTypography variant="body2">{item.summary}</AppTypography> : null}
                    <AppTypography variant="caption" color="text.secondary">{item.offensePlanCount} offensive plan{item.offensePlanCount === 1 ? "" : "s"}</AppTypography>
                </AppPaper>
            ))}
        </AppBox>
    );
}
