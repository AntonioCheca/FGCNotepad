import React from "react";
import {useRouter} from "next/router";
import {useNeutralStats, useNeutralStatsOptions} from "@/hooks/useNeutralStats";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTab, AppTabs} from "@/src/components/ui/AppTabs";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import type {NeutralStatsFilterState, NeutralStatsResponse, NeutralStatsTab} from "@/src/types/neutralStats";
import {MoveProfilesGrid} from "./components/MoveProfilesGrid";
import {NeutralCharacterField} from "./components/NeutralCharacterField";
import {NeutralDistributionChart} from "./components/NeutralDistributionChart";
import {NeutralFiltersPanel} from "./components/NeutralFiltersPanel";
import {NeutralSampleSummary} from "./components/NeutralSampleSummary";
import {NeutralStickyBar} from "./components/NeutralStickyBar";
import {filterSummary} from "./neutralFilterSummary";
import {buildNeutralQuery, buildNeutralUrlQuery, defaultFilterState, defaultSideGauges, parseNeutralQuery} from "./neutralStatsQuery";

const STICKY_BAR_OFFSET = 76;

function usePanelScrolledAway(panelRef: React.RefObject<HTMLElement | null>, enabled: boolean): boolean {
    const [scrolledAway, setScrolledAway] = React.useState(false);

    React.useEffect(() => {
        const panel = panelRef.current;
        if (!enabled || panel === null) {
            setScrolledAway(false);
            return;
        }
        const observer = new IntersectionObserver(([entry]) => {
            setScrolledAway(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        });
        observer.observe(panel);

        return () => observer.disconnect();
    }, [panelRef, enabled]);

    return scrolledAway;
}

function NeutralResults({stats, tab, showAll, onTabChange, onShowAll}: {
    stats: NeutralStatsResponse;
    tab: NeutralStatsTab;
    showAll: boolean;
    onTabChange: (tab: NeutralStatsTab) => void;
    onShowAll: () => void;
}) {
    return (
        <AppBox sx={{display: "grid", gap: 1.25, minWidth: 0}}>
            <NeutralSampleSummary sample={stats.sample}/>
            <AppTabs
                value={tab}
                onChange={(_, value: NeutralStatsTab) => onTabChange(value)}
                variant="scrollable"
                allowScrollButtonsMobile
                aria-label="Neutral Stats views"
                sx={{borderBottom: "1px solid", borderColor: "divider", minHeight: 44}}
            >
                <AppTab value="profiles" label="Move Profiles" sx={{minHeight: 44}}/>
                <AppTab value="distribution" label="Neutral Distribution" sx={{minHeight: 44}}/>
            </AppTabs>
            {stats.sample.observationCount === 0 ? (
                <AppTypography variant="body2" color="text.secondary" sx={{py: 4, textAlign: "center"}}>No neutral observations match these filters.</AppTypography>
            ) : tab === "profiles" ? (
                <MoveProfilesGrid stats={stats} showAll={showAll} onShowAll={onShowAll}/>
            ) : (
                <NeutralDistributionChart stats={stats}/>
            )}
        </AppBox>
    );
}

export default function NeutralStatsPage() {
    const router = useRouter();
    const [filters, setFilters] = React.useState<NeutralStatsFilterState | null>(null);
    const [tab, setTab] = React.useState<NeutralStatsTab>("profiles");
    const [showAll, setShowAll] = React.useState(false);
    const panelRef = React.useRef<HTMLDivElement>(null);
    const resultsRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (router.isReady && filters === null) {
            const parsed = parseNeutralQuery(router.query);
            setFilters(parsed.filters);
            setTab(parsed.tab);
        }
    }, [router.isReady, router.query, filters]);

    const current = filters ?? defaultFilterState();
    const {options, error: optionsError} = useNeutralStatsOptions(current.characterId, current.opponentId);
    const statsQuery = React.useMemo(() => (current.characterId ? buildNeutralQuery(current) : null), [current]);
    const {data, loading, error, retry} = useNeutralStats(filters === null ? null : statsQuery);
    const panelScrolledAway = usePanelScrolledAway(panelRef, current.characterId !== null && options !== null);

    const writeUrl = React.useCallback((nextFilters: NeutralStatsFilterState, nextTab: NeutralStatsTab) => {
        void router.replace({pathname: router.pathname, query: buildNeutralUrlQuery(nextFilters, nextTab)}, undefined, {shallow: true, scroll: false});
    }, [router]);

    const applyFilters = React.useCallback((nextFilters: NeutralStatsFilterState) => {
        setFilters(nextFilters);
        writeUrl(nextFilters, tab);
        const results = resultsRef.current;
        if (results && results.getBoundingClientRect().top < 0) {
            window.scrollTo({top: window.scrollY + results.getBoundingClientRect().top - STICKY_BAR_OFFSET, behavior: "smooth"});
        }
    }, [tab, writeUrl]);

    const changeFilters = (patch: Partial<NeutralStatsFilterState>) => applyFilters({...current, ...patch});
    const changeCharacter = (characterId: string | null) => applyFilters(characterId === null
        ? defaultFilterState()
        : {...current, characterId, actor: {...current.actor, health: null}, actorResources: {}});
    const changeOpponent = (opponentId: string | null) => applyFilters({...current, opponentId, opponent: defaultSideGauges(), opponentResources: {}});
    const changeTab = (nextTab: NeutralStatsTab) => {
        setTab(nextTab);
        writeUrl(current, nextTab);
    };

    const characterName = options?.characters.find((character) => character.id === current.characterId)?.name ?? "";

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell title="Neutral Stats">
                {optionsError ? <InlineNotice severity="error">{optionsError}</InlineNotice> : null}
                {options === null || filters === null ? (
                    optionsError ? null : <AppBox sx={{display: "grid", placeItems: "center", py: 4}}><AppCircularProgress/></AppBox>
                ) : current.characterId === null ? (
                    <AppBox sx={{maxWidth: {sm: 360}, pt: 0.5}}>
                        <NeutralCharacterField label="Character" characters={options.characters} value={null} onChange={changeCharacter}/>
                    </AppBox>
                ) : (
                    <>
                        <AppBox ref={panelRef} sx={{scrollMarginTop: 16}}>
                            <NeutralFiltersPanel
                                filters={current}
                                options={options}
                                loading={loading}
                                error={error}
                                onRetry={retry}
                                onChange={changeFilters}
                                onCharacterChange={changeCharacter}
                                onOpponentChange={changeOpponent}
                            />
                        </AppBox>
                        <NeutralStickyBar
                            visible={panelScrolledAway}
                            title={characterName}
                            summary={filterSummary(current, options)}
                            loading={loading}
                            hasError={error !== null}
                            onOpenFilters={() => panelRef.current?.scrollIntoView({behavior: "smooth", block: "start"})}
                        />
                        <AppBox ref={resultsRef} sx={{minWidth: 0}}>
                            {data ? (
                                <NeutralResults stats={data} tab={tab} showAll={showAll} onTabChange={changeTab} onShowAll={() => setShowAll(true)}/>
                            ) : loading ? (
                                <AppBox sx={{display: "grid", placeItems: "center", py: 4}}><AppCircularProgress/></AppBox>
                            ) : null}
                        </AppBox>
                    </>
                )}
            </PageShell>
        </AppContainer>
    );
}
