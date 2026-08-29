import React from "react";
import {useTurnsGuide} from "@/hooks/useTurnsGuide";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableContainer} from "@/src/components/ui/AppTableContainer";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {TurnsGuideHeuristic, TurnsGuideMove, TurnsGuideMoveSection} from "@/src/types/guide";

export default function TurnsGuidePage() {
    const {guide, loading, error} = useTurnsGuide();
    const [characterFilter, setCharacterFilter] = React.useState("");

    const characters = collectCharacters(guide ? [
        ...guide.sections.plusNormals.moves,
        ...guide.sections.plusSpecials.moves,
    ] : []);

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Turns Guide" badgeLabel="Beginner reference">
                {error ? <InlineNotice severity="error">{error}</InlineNotice> : null}
                {loading ? <AppBox sx={{display: "grid", placeItems: "center", py: 5}}><AppCircularProgress /></AppBox> : null}
                {guide ? (
                    <AppBox sx={{display: "grid", gap: {xs: 1.25, md: 1.5}, minWidth: 0}}>
                        <SectionCard title="Fast Rules" variant="review">
                            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", lg: "repeat(2, minmax(0, 1fr))"}, gap: 0.85}}>
                                {guide.heuristics.map((heuristic) => <HeuristicCard key={heuristic.title} heuristic={heuristic} />)}
                            </AppBox>
                        </SectionCard>

                        <AppPaper variant="outlined" sx={{p: 1.2, borderRadius: 2.5, backgroundColor: "fgc.surface.base", display: "grid", gap: 1}}>
                            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "minmax(220px, 320px)"}, gap: 1, alignItems: "center"}}>
                                <AppFormControl size="small">
                                    <AppInputLabel id="turns-character-filter-label">Character</AppInputLabel>
                                    <AppSelect<string> labelId="turns-character-filter-label" label="Character" value={characterFilter} onChange={(event) => setCharacterFilter(String(event.target.value))}>
                                        <AppMenuItem value="">All characters</AppMenuItem>
                                        {characters.map((character) => <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>)}
                                    </AppSelect>
                                </AppFormControl>
                            </AppBox>
                        </AppPaper>

                        <MoveSection section={guide.sections.plusNormals} characterFilter={characterFilter} emptyText="No always-plus normals match this filter." />
                        <MoveSection section={guide.sections.plusSpecials} characterFilter={characterFilter} emptyText="No always-plus specials match this filter." />
                        <MoveSection section={guide.sections.spacedNormals} characterFilter={characterFilter} emptyText="This list will fill when move data has a spacing condition column." />
                        <MoveSection section={guide.sections.spacedSpecials} characterFilter={characterFilter} emptyText="This list will fill when move data has a spacing condition column." />
                    </AppBox>
                ) : null}
            </PageShell>
        </AppContainer>
    );
}

function HeuristicCard({heuristic}: {heuristic: TurnsGuideHeuristic}) {
    return (
        <AppPaper variant="outlined" sx={{p: 1.15, borderRadius: 2, backgroundColor: "fgc.surface.sunken", display: "grid", gap: 0.55}}>
            <AppTypography variant="subtitle2" sx={{fontWeight: 800}}>{heuristic.title}</AppTypography>
            <AppTypography variant="body2" color="text.secondary">{heuristic.body}</AppTypography>
        </AppPaper>
    );
}

function MoveSection({section, characterFilter, emptyText, advantageLabel = "On block"}: {section: TurnsGuideMoveSection; characterFilter: string; emptyText: string; advantageLabel?: string}) {
    const moves = characterFilter ? section.moves.filter((move) => move.character.id === characterFilter) : section.moves;
    const isPlanned = section.status === "planned_data_column";

    return (
        <SectionCard title={section.title} tone={isPlanned ? "sunken" : "default"}>
            {isPlanned ? <InlineNotice severity="info">This kind of moves belongs here, but the current frame data does not have a reliable spacing condition column yet.</InlineNotice> : null}
            {moves.length === 0 ? <InlineNotice severity="info">{emptyText}</InlineNotice> : <MoveList moves={moves} advantageLabel={advantageLabel} />}
        </SectionCard>
    );
}

function MoveList({moves, advantageLabel}: {moves: TurnsGuideMove[]; advantageLabel: string}) {
    return (
        <>
            <AppBox sx={{display: {xs: "grid", md: "none"}, gap: 0.75}}>
                {moves.map((move) => <MoveCard key={move.id} move={move} advantageLabel={advantageLabel} />)}
            </AppBox>
            <AppTableContainer sx={{display: {xs: "none", md: "block"}, borderRadius: 2, border: "1px solid", borderColor: "divider", backgroundColor: "fgc.surface.sunken"}}>
                <AppTable size="small">
                    <AppTableHead>
                        <AppTableRow>
                            <AppTableCell>Character</AppTableCell>
                            <AppTableCell>Move</AppTableCell>
                            <AppTableCell align="right">{advantageLabel}</AppTableCell>
                        </AppTableRow>
                    </AppTableHead>
                    <AppTableBody>
                        {moves.map((move) => (
                            <AppTableRow key={move.id}>
                                <AppTableCell>{move.character.name}</AppTableCell>
                                <AppTableCell sx={{fontWeight: 800}}>{move.numpadNotation}</AppTableCell>
                                <AppTableCell align="right">+{move.advantageOnBlock}</AppTableCell>
                            </AppTableRow>
                        ))}
                    </AppTableBody>
                </AppTable>
            </AppTableContainer>
        </>
    );
}

function MoveCard({move, advantageLabel}: {move: TurnsGuideMove; advantageLabel: string}) {
    return (
        <AppPaper variant="outlined" sx={{p: 1, borderRadius: 2, backgroundColor: "fgc.surface.sunken", display: "grid", gap: 0.4}}>
            <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center"}}>
                <AppTypography variant="subtitle2" sx={{fontWeight: 800}}>{move.character.name}</AppTypography>
                <AppChip size="small" color="success" variant="outlined" label={`+${move.advantageOnBlock}`} />
            </AppBox>
            <AppTypography variant="body2">{move.numpadNotation}</AppTypography>
            <AppTypography variant="caption" color="text.secondary">{advantageLabel}</AppTypography>
        </AppPaper>
    );
}

function collectCharacters(moves: TurnsGuideMove[]): Array<{id: string; name: string}> {
    const characterMap = new Map<string, {id: string; name: string}>();
    for (const move of moves) {
        characterMap.set(move.character.id, move.character);
    }

    return Array.from(characterMap.values()).sort((first, second) => first.name.localeCompare(second.name));
}
