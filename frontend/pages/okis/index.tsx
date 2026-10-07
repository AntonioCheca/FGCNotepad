import React from "react";
import Link from "next/link";
import useOkis from "@/hooks/useOkis";
import {CharacterSelect} from "@/src/components/characters/CharacterSelect";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppDivider} from "@/src/components/ui/AppDivider";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {OkiMovePicker, type OkiMoveOption} from "@/src/components/okis/OkiMovePicker";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {moveLabel} from "@/src/features/pressure-graph/pressureGraphTypes";
import type {OkiProfileSummary, OkiSearchFilters} from "@/src/types/oki";

export default function OkiSearchPage() {
    const {listOkis} = useOkis();
    const [characterId, setCharacterId] = React.useState("");
    const [ender, setEnder] = React.useState<OkiMoveOption | null>(null);
    const [items, setItems] = React.useState<OkiProfileSummary[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const filters = React.useMemo<OkiSearchFilters>(() => ({
        characterId: characterId || undefined,
        moveId: ender?.id,
    }), [characterId, ender?.id]);

    React.useEffect(() => {
        let canceled = false;
        setLoading(true);
        setError(null);
        listOkis(filters)
            .then((result) => {
                if (!canceled) {
                    setItems(result ?? []);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setError("Could not load okis.");
                }
            })
            .finally(() => {
                if (!canceled) {
                    setLoading(false);
                }
            });

        return () => {
            canceled = true;
        };
    }, [filters, listOkis]);

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Search Okis">
                {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}
                <AppPaper variant="outlined" sx={{p: 1.4, borderRadius: 2.5, display: "grid", gridTemplateColumns: {xs: "1fr", md: "220px minmax(240px, 420px) auto"}, gap: 1, alignItems: "center", backgroundColor: "fgc.surface.base"}}>
                    <CharacterSelect
                        value={characterId}
                        allowAny
                        onChange={(nextCharacterId) => {
                            setCharacterId(nextCharacterId);
                            setEnder(null);
                        }}
                    />
                    <OkiMovePicker key={characterId} label="Ender" value={ender} characterId={characterId || undefined} disabled={!characterId} onChange={setEnder} />
                    <Link href={characterId ? `/okis/new?characterId=${characterId}` : "/okis/new"} style={{textDecoration: "none", justifySelf: "end"}}><AppButton type="button" variant="contained" color="primary" sx={{width: {xs: "100%", sm: "auto"}}}>Create oki</AppButton></Link>
                </AppPaper>

                {loading ? <AppBox sx={{display: "grid", placeItems: "center", py: 4}}><AppCircularProgress /></AppBox> : <OkiResults items={items} />}
            </PageShell>
        </AppContainer>
    );
}

// Results arrive sorted by character, so consecutive items form each character's group.
function groupByCharacter(items: OkiProfileSummary[]): Array<{character: string; items: OkiProfileSummary[]}> {
    const groups: Array<{character: string; items: OkiProfileSummary[]}> = [];
    for (const item of items) {
        const last = groups.at(-1);
        if (last?.character === item.move.character.name) {
            last.items.push(item);
        } else {
            groups.push({character: item.move.character.name, items: [item]});
        }
    }

    return groups;
}

function OkiResults({items}: {items: OkiProfileSummary[]}) {
    if (items.length === 0) {
        return <InlineNotice severity="info">No okis for this search yet.</InlineNotice>;
    }

    return (
        <AppBox sx={{display: "grid", gap: 1.5}}>
            {groupByCharacter(items).map((group, index) => (
                <AppBox key={group.character} component="section" sx={{display: "grid", gap: 0.75}}>
                    {index > 0 ? <AppDivider /> : null}
                    <AppTypography variant="h6" component="h2" sx={{fontWeight: 850}}>{group.character}</AppTypography>
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)"}, gap: 1}}>
                        {group.items.map((item) => (
                            <Link key={item.id} href={`/okis/${item.id}`} style={{color: "inherit", textDecoration: "none"}}>
                                <AppPaper variant="outlined" sx={{px: 1.4, py: 1.1, borderRadius: 2, backgroundColor: "fgc.surface.base", "&:hover": {borderColor: "fgc.border.strong"}}}>
                                    <AppTypography sx={{fontWeight: 800, fontSize: "1.05rem"}}>{moveLabel(item.move)}</AppTypography>
                                </AppPaper>
                            </Link>
                        ))}
                    </AppBox>
                </AppBox>
            ))}
        </AppBox>
    );
}
