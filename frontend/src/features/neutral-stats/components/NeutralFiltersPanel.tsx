import React from "react";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppDivider} from "@/src/components/ui/AppDivider";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {NeutralStatsFilterState, NeutralStatsOptions} from "@/src/types/neutralStats";
import {NO_RANK_MIN} from "../neutralStatsQuery";
import {NeutralCharacterField} from "./NeutralCharacterField";
import {NeutralMultiSelectField} from "./NeutralMultiSelectField";
import {NeutralRankBoundField} from "./NeutralRankBoundField";
import {NeutralSelectField} from "./NeutralSelectField";
import {NeutralSideStateFilters} from "./NeutralSideStateFilters";
import {NeutralRequestStatus} from "./NeutralRequestStatus";

interface NeutralFiltersPanelProps {
    filters: NeutralStatsFilterState;
    options: NeutralStatsOptions;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onChange: (patch: Partial<NeutralStatsFilterState>) => void;
    onCharacterChange: (characterId: string | null) => void;
    onOpponentChange: (opponentId: string | null) => void;
}

const PATCH_OPTIONS = [
    {value: "all", label: "All available patches"},
    {value: "latest", label: "Latest patch only"},
];

const rowSx = {display: "grid", gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))"}, gap: 1, minWidth: 0};

export function NeutralFiltersPanel({filters, options, loading, error, onRetry, onChange, onCharacterChange, onOpponentChange}: NeutralFiltersPanelProps) {
    const lifeOf = (characterId: string | null): number => options.characters.find((character) => character.id === characterId)?.life ?? 10000;

    return (
        <SectionCard title="Filters" tone="raised">
            <NeutralRequestStatus loading={loading} error={error} onRetry={onRetry}/>
            <AppBox sx={rowSx}>
                <NeutralCharacterField label="Character" characters={options.characters} value={filters.characterId} onChange={onCharacterChange}/>
                <NeutralCharacterField label="Matchup" placeholder="All opponents" characters={options.characters} value={filters.opponentId} onChange={onOpponentChange}/>
                <NeutralRankBoundField
                    id="neutral-rank-min"
                    label="Minimum rank"
                    options={options.ranks.minimum}
                    unsetValue={NO_RANK_MIN}
                    unsetLabel="No minimum"
                    value={filters.rankMin}
                    onChange={(rankMin) => onChange({rankMin})}
                />
                <NeutralRankBoundField
                    id="neutral-rank-max"
                    label="Maximum rank"
                    options={options.ranks.maximum}
                    unsetValue=""
                    unsetLabel="No maximum"
                    value={filters.rankMax}
                    onChange={(rankMax) => onChange({rankMax})}
                />
            </AppBox>
            <AppBox sx={rowSx}>
                <NeutralMultiSelectField
                    id="neutral-region"
                    label="Region"
                    emptyLabel="All regions"
                    options={options.regions}
                    selected={filters.regions}
                    onChange={(regions) => onChange({regions})}
                />
                <NeutralMultiSelectField
                    id="neutral-relative-mr"
                    label="Opponent MR vs player"
                    emptyLabel="All"
                    options={options.relativeMr}
                    selected={filters.relativeMr}
                    onChange={(relativeMr) => onChange({relativeMr})}
                />
                <NeutralSelectField
                    id="neutral-bucket"
                    label="Spacing resolution"
                    options={options.bucketSizes.map((size) => ({value: size, label: size}))}
                    value={filters.bucketSize}
                    onChange={(bucketSize) => onChange({bucketSize})}
                />
                <NeutralSelectField
                    id="neutral-patch"
                    label="Patch"
                    options={PATCH_OPTIONS}
                    value={filters.patch}
                    onChange={(patch) => onChange({patch: patch === "latest" ? "latest" : "all"})}
                />
            </AppBox>
            <AppDivider/>
            <NeutralSideStateFilters
                id="neutral-actor"
                title="Player state"
                maxHealth={lifeOf(filters.characterId)}
                driveBars={options.gauges.driveBars}
                superBars={options.gauges.superBars}
                gauges={filters.actor}
                resources={options.resources.actor}
                selection={filters.actorResources}
                onGaugesChange={(actor) => onChange({actor})}
                onSelectionChange={(actorResources) => onChange({actorResources})}
            />
            {filters.opponentId ? (
                <>
                    <AppDivider/>
                    <NeutralSideStateFilters
                        id="neutral-opponent"
                        title="Opponent state"
                        maxHealth={lifeOf(filters.opponentId)}
                        driveBars={options.gauges.driveBars}
                        superBars={options.gauges.superBars}
                        gauges={filters.opponent}
                        resources={options.resources.opponent}
                        selection={filters.opponentResources}
                        onGaugesChange={(opponent) => onChange({opponent})}
                        onSelectionChange={(opponentResources) => onChange({opponentResources})}
                    />
                </>
            ) : null}
        </SectionCard>
    );
}
