import React from "react";
import Link from "next/link";
import useBlockstrings from "@/hooks/useBlockstrings";
import {CharacterSelect} from "@/src/components/characters/CharacterSelect";
import {OkiMovePicker, type OkiMoveOption} from "@/src/components/okis/OkiMovePicker";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {blockstringTitle} from "@/src/components/blockstrings/blockstringGraphDraft";
import {moveLabel} from "@/src/features/pressure-graph/pressureGraphTypes";
import type {BlockstringSummary} from "@/src/types/blockstring";
import {CreateContentLink} from "@/src/components/auth/CreateContentLink";

export default function BlockstringSearchPage() {
    const {listBlockstrings} = useBlockstrings();
    const [q, setQ] = React.useState("");
    const [characterId, setCharacterId] = React.useState("");
    const [startingMove, setStartingMove] = React.useState<OkiMoveOption | null>(null);
    const [items, setItems] = React.useState<BlockstringSummary[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let canceled = false;
        const handle = window.setTimeout(() => {
            setLoading(true);
            setError(null);
            listBlockstrings({q: q.trim() || undefined, attackerCharacterId: characterId || undefined, startingMoveId: startingMove?.id})
                .then((result: BlockstringSummary[]) => { if (!canceled) setItems(result ?? []); })
                .catch(() => { if (!canceled) setError("Could not load blockstrings."); })
                .finally(() => { if (!canceled) setLoading(false); });
        }, 220);
        return () => { canceled = true; window.clearTimeout(handle); };
    }, [characterId, listBlockstrings, q, startingMove?.id]);

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Blockstrings">
                {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}
                <AppPaper variant="outlined" sx={{p: 1.4, borderRadius: 2.5, display: "grid", gridTemplateColumns: {xs: "1fr", md: "220px minmax(0, 1fr) minmax(0, 1fr) auto"}, gap: 1, alignItems: "center", backgroundColor: "fgc.surface.base"}}>
                    <CharacterSelect
                        value={characterId}
                        allowAny
                        onChange={(nextCharacterId) => {
                            setCharacterId(nextCharacterId);
                            setStartingMove(null);
                        }}
                    />
                    <AppTextField size="small" margin="none" label="Search" value={q} onChange={(event) => setQ(event.target.value)} />
                    <OkiMovePicker key={characterId} label="Starting move" value={startingMove} characterId={characterId || undefined} disabled={!characterId} onChange={setStartingMove} />
                    <CreateContentLink href={characterId ? `/blockstrings/new?characterId=${characterId}` : "/blockstrings/new"} label="Create blockstring" linkStyle={{justifySelf: "end"}} buttonSx={{width: {xs: "100%", md: "auto"}}} />
                </AppPaper>

                {loading ? <AppBox sx={{display: "grid", placeItems: "center", py: 4}}><AppCircularProgress /></AppBox> : <BlockstringResults items={items} />}
            </PageShell>
        </AppContainer>
    );
}

function BlockstringResults({items}: {items: BlockstringSummary[]}) {
    if (items.length === 0) {
        return <InlineNotice severity="info">No blockstrings match these filters.</InlineNotice>;
    }

    return (
        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", lg: "1fr 1fr"}, gap: 1}}>
            {items.map((item) => (
                <Link key={item.id} href={`/blockstrings/${item.id}`} style={{color: "inherit", textDecoration: "none"}}>
                    <AppPaper variant="outlined" sx={{px: 1.4, py: 1.1, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1, backgroundColor: "fgc.surface.base", "&:hover": {borderColor: "fgc.border.strong"}}}>
                        <AppTypography sx={{fontWeight: 800, fontSize: "1.05rem", minWidth: 0}}>{blockstringTitle(item)}</AppTypography>
                        {item.startingMove ? <AppTypography variant="body2" sx={{color: "text.secondary", fontWeight: 700, whiteSpace: "nowrap"}}>{moveLabel(item.startingMove)}</AppTypography> : null}
                    </AppPaper>
                </Link>
            ))}
        </AppBox>
    );
}
