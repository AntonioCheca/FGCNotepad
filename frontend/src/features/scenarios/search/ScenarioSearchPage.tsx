import React from "react";

import {useCharacters} from "@/hooks/useCharacters";
import useMoves from "@/hooks/useMoves";
import {useScenarios} from "@/hooks/useScenarios";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {ScenarioSearchActions} from "./rendering/ScenarioSearchActions";
import {ScenarioSearchFiltersPanel} from "./rendering/ScenarioSearchFiltersPanel";
import {ScenarioResultsPanel} from "./rendering/ScenarioResultsPanel";
import {buildScenarioSearchDraft, countActiveScenarioFilters, normalizeScenarioCharacterOptions} from "./scenarioSearchUtils";
import {useScenarioSearchFilters} from "./useScenarioSearchFilters";
import {useScenarioSearchResults} from "./useScenarioSearchResults";
import {useScenarioTriggerMoveSearch} from "./useScenarioTriggerMoveSearch";

export default function ScenarioSearchPage() {
    const {listScenarios} = useScenarios();
    const {characters} = useCharacters();
    const {searchMoves} = useMoves();
    const {
        state: filterState,
        setQuery,
        setScenarioType,
        setDefenderCharacterId,
        selectAttacker,
        setTriggerMoveSelection,
        setTriggerMoveInput,
        toggleAdvancedFilters,
        resetFilters,
    } = useScenarioSearchFilters();
    const [filters, setFilters] = React.useState(() => buildScenarioSearchDraft(filterState));

    const compactFieldSx = React.useMemo(
        () => ({
            "& .MuiFormControl-root": {
                margin: 0,
            },
            "& .MuiInputBase-root": {
                minHeight: 40,
            },
        }),
        [],
    );

    const characterOptions = React.useMemo(() => normalizeScenarioCharacterOptions(characters), [characters]);
    const selectedAttacker = React.useMemo(() => {
        if (!filterState.attackerCharacterId) {
            return null;
        }

        return characterOptions.find((character) => character.id === filterState.attackerCharacterId) ?? null;
    }, [filterState.attackerCharacterId, characterOptions]);
    const selectedDefender = React.useMemo(() => {
        if (!filterState.defenderCharacterId) {
            return null;
        }

        return characterOptions.find((character) => character.id === filterState.defenderCharacterId) ?? null;
    }, [filterState.defenderCharacterId, characterOptions]);
    const normalizedFilters = React.useMemo(() => buildScenarioSearchDraft(filterState), [filterState]);
    const activeFilterCount = React.useMemo(() => countActiveScenarioFilters(normalizedFilters), [normalizedFilters]);
    const {triggerMoveOptions, searchingMoves, clearTriggerMoveOptions} = useScenarioTriggerMoveSearch({
        triggerMoveInput: filterState.triggerMoveInput,
        attackerCharacterId: filterState.attackerCharacterId,
        selectedAttacker,
        searchMoves,
    });
    const {items, loading, hasLoadedAtLeastOnce, errorMessage} = useScenarioSearchResults({filters, listScenarios});

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            setFilters(normalizedFilters);
        }, 240);

        return () => {
            window.clearTimeout(handle);
        };
    }, [normalizedFilters]);

    const handleResetFilters = React.useCallback(() => {
        resetFilters();
        clearTriggerMoveOptions();
    }, [clearTriggerMoveOptions, resetFilters]);

    return (
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell
                title="Search Scenarios"
                subtitle="Fast matchup retrieval: lock attacker and trigger move, refine scenario context, and keep reviewing results while filters update."
                badgeLabel={`${items.length} result${items.length === 1 ? "" : "s"}`}
            >
                {errorMessage ? <InlineNotice severity="error">{errorMessage}</InlineNotice> : null}

                <ScenarioSearchActions />

                <ScenarioSearchFiltersPanel
                    filterState={filterState}
                    activeFilterCount={activeFilterCount}
                    characterOptions={characterOptions}
                    selectedAttacker={selectedAttacker}
                    selectedDefender={selectedDefender}
                    triggerMoveOptions={triggerMoveOptions}
                    searchingMoves={searchingMoves}
                    compactFieldSx={compactFieldSx}
                    onAttackerChange={(value) => {
                        selectAttacker(value?.id ?? "");
                        clearTriggerMoveOptions();
                    }}
                    onTriggerMoveChange={setTriggerMoveSelection}
                    onTriggerMoveInputChange={setTriggerMoveInput}
                    onDefenderChange={(value) => setDefenderCharacterId(value?.id ?? "")}
                    onScenarioTypeChange={setScenarioType}
                    onQueryChange={setQuery}
                    onToggleAdvancedFilters={toggleAdvancedFilters}
                    onResetFilters={handleResetFilters}
                />

                <ScenarioResultsPanel items={items} loading={loading} hasLoadedAtLeastOnce={hasLoadedAtLeastOnce} />
            </PageShell>
        </AppContainer>
    );
}
