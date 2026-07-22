import React from "react";

import {useCharacters} from "@/hooks/useCharacters";
import useMoves from "@/hooks/useMoves";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCollapse} from "@/src/components/ui/AppCollapse";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {ComboAdvancedFiltersSection} from "./filters/ComboAdvancedFiltersSection";
import {ComboFiltersHeader} from "./filters/ComboFiltersHeader";
import {ComboPrimaryFiltersSection} from "./filters/ComboPrimaryFiltersSection";
import {ComboRequirementsFiltersSection} from "./filters/ComboRequirementsFiltersSection";
import {DEFAULT_COMBO_FILTER_SORT} from "./filters/comboFilterConstants";
import type {ComboFiltersProps, ComboSearchFilters} from "./filters/comboFilterTypes";
import {buildComboSearchFilters, countActiveComboFilters, normalizeCharacterOptions} from "./filters/comboFilterUtils";
import {useComboFilterState} from "./filters/useComboFilterState";
import {useComboFirstMoveSearch} from "./filters/useComboFirstMoveSearch";

export type {ComboSearchFilters};

export default function ComboFilters({onChange}: ComboFiltersProps) {
    const {characters} = useCharacters();
    const {searchMoves} = useMoves();
    const {
        state,
        setQuery,
        selectCharacter,
        setFirstMove,
        setFirstMoveQuery,
        setMinDifficulty,
        setMaxDifficulty,
        setMinDamage,
        setMaxDamage,
        setRequirementToggle,
        setMoveTypes,
        setSort,
        toggleAdvancedFilters,
        clearFilters,
    } = useComboFilterState();

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

    const characterOptions = React.useMemo(() => normalizeCharacterOptions(characters), [characters]);
    const selectedCharacter = React.useMemo(() => {
        if (!state.characterId) {
            return null;
        }

        return characterOptions.find((character) => character.id === state.characterId) ?? null;
    }, [state.characterId, characterOptions]);
    const {firstMoveOptions, searchingMoves, clearFirstMoveOptions} = useComboFirstMoveSearch({
        firstMoveQuery: state.firstMoveQuery,
        characterId: state.characterId,
        selectedCharacter,
        searchMoves,
    });
    const activeFilterCount = React.useMemo(() => countActiveComboFilters(state), [state]);
    const normalizedFilters = React.useMemo(() => buildComboSearchFilters(state), [state]);

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            onChange(normalizedFilters);
        }, 240);

        return () => {
            window.clearTimeout(handle);
        };
    }, [normalizedFilters, onChange]);

    const handleClearFilters = React.useCallback(() => {
        clearFilters();
        clearFirstMoveOptions();
        onChange({sort: DEFAULT_COMBO_FILTER_SORT});
    }, [clearFilters, clearFirstMoveOptions, onChange]);

    return (
        <AppPaper variant="outlined" sx={{p: {xs: 1.25, md: 1.5}, mb: 2, borderRadius: 2.5, display: "grid", gap: 1}}>
            <ComboFiltersHeader activeFilterCount={activeFilterCount} />

            <ComboPrimaryFiltersSection
                characterOptions={characterOptions}
                selectedCharacter={selectedCharacter}
                firstMove={state.firstMove}
                firstMoveQuery={state.firstMoveQuery}
                firstMoveOptions={firstMoveOptions}
                searchingMoves={searchingMoves}
                query={state.query}
                compactFieldSx={compactFieldSx}
                onCharacterChange={(value) => {
                    selectCharacter(value?.id ?? "");
                    clearFirstMoveOptions();
                }}
                onFirstMoveChange={setFirstMove}
                onFirstMoveQueryChange={setFirstMoveQuery}
                onQueryChange={setQuery}
            />

            <ActionBar>
                <AppButton type="button" variant="text" color="secondary" onClick={toggleAdvancedFilters} sx={{color: "text.secondary"}}>
                    {state.showAdvancedFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
                </AppButton>
                <AppButton type="button" variant="outlined" color="secondary" onClick={handleClearFilters}>Clear Filters</AppButton>
            </ActionBar>

            <AppCollapse in={state.showAdvancedFilters} timeout={200} unmountOnExit>
                <AppBox sx={{display: "grid", gap: 1, pt: 0.75}}>
                    <ComboAdvancedFiltersSection
                        sort={state.sort}
                        moveTypes={state.moveTypes}
                        minDifficulty={state.minDifficulty}
                        maxDifficulty={state.maxDifficulty}
                        minDamage={state.minDamage}
                        maxDamage={state.maxDamage}
                        onSortChange={setSort}
                        onMoveTypesChange={setMoveTypes}
                        onMinDifficultyChange={setMinDifficulty}
                        onMaxDifficultyChange={setMaxDifficulty}
                        onMinDamageChange={setMinDamage}
                        onMaxDamageChange={setMaxDamage}
                    />

                    <ComboRequirementsFiltersSection requirements={state.requirements} onRequirementToggle={setRequirementToggle} />
                </AppBox>
            </AppCollapse>
        </AppPaper>
    );
}
