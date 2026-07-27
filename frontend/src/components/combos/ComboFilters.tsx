import React from "react";

import {useCharacters} from "@/hooks/useCharacters";
import useCombos from "@/hooks/useCombos";
import useMoves from "@/hooks/useMoves";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCollapse} from "@/src/components/ui/AppCollapse";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {ActionBar} from "@/src/components/ui/tactical/ActionBar";
import {ComboAdvancedFiltersSection} from "./filters/ComboAdvancedFiltersSection";
import {ComboDriveWindowsFiltersSection} from "./filters/ComboDriveWindowsFiltersSection";
import {ComboFiltersHeader} from "./filters/ComboFiltersHeader";
import {ComboPrimaryFiltersSection} from "./filters/ComboPrimaryFiltersSection";
import {ComboRequirementsFiltersSection} from "./filters/ComboRequirementsFiltersSection";
import {DEFAULT_COMBO_FILTER_SORT} from "./filters/comboFilterConstants";
import type {ComboFiltersProps, ComboSearchFilters} from "./filters/comboFilterTypes";
import {buildComboSearchFilters, normalizeCharacterOptions, normalizeRequirementObjectOptions} from "./filters/comboFilterUtils";
import {useComboFilterState} from "./filters/useComboFilterState";
import {useComboMoveSearch} from "./filters/useComboMoveSearch";
import type {RequirementObjectOption} from "@/src/types/combo";

export type {ComboSearchFilters};

export default function ComboFilters({onChange}: ComboFiltersProps) {
    const {characters} = useCharacters();
    const {searchMoves} = useMoves();
    const {fetchRequirementObjects} = useCombos();
    const {
        state,
        setQuery,
        selectCharacter,
        setFirstMove,
        setFirstMoveQuery,
        setEnderMove,
        setEnderMoveQuery,
        setMinDifficulty,
        setMaxDifficulty,
        setMinDamage,
        setMaxDamage,
        addDriveWindow,
        removeDriveWindow,
        setDriveWindowRange,
        setRequirementToggle,
        setRequirementObject,
        setAddedObject,
        setConsumedObject,
        toggleAdvancedFilters,
        clearFilters,
    } = useComboFilterState();
    const [requirementObjectOptions, setRequirementObjectOptions] = React.useState<RequirementObjectOption[]>([]);

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
    const {moveOptions: firstMoveOptions, searchingMoves: searchingFirstMoves, clearMoveOptions: clearFirstMoveOptions} = useComboMoveSearch({
        moveQuery: state.firstMoveQuery,
        characterId: state.characterId,
        selectedCharacter,
        searchMoves,
    });
    const {moveOptions: enderMoveOptions, searchingMoves: searchingEnderMoves, clearMoveOptions: clearEnderMoveOptions} = useComboMoveSearch({
        moveQuery: state.enderMoveQuery,
        characterId: state.characterId,
        selectedCharacter,
        searchMoves,
    });
    const normalizedFilters = React.useMemo(() => buildComboSearchFilters(state), [state]);

    React.useEffect(() => {
        fetchRequirementObjects()
            .then((result: unknown) => setRequirementObjectOptions(normalizeRequirementObjectOptions(result)))
            .catch(() => setRequirementObjectOptions([]));
    }, [fetchRequirementObjects]);

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
        clearEnderMoveOptions();
        onChange({sort: DEFAULT_COMBO_FILTER_SORT});
    }, [clearEnderMoveOptions, clearFilters, clearFirstMoveOptions, onChange]);

    return (
        <AppPaper variant="outlined" sx={{p: {xs: 1.25, md: 1.5}, mb: 2, borderRadius: 2.5, display: "grid", gap: 1}}>
            <ComboFiltersHeader />

            <ComboPrimaryFiltersSection
                characterOptions={characterOptions}
                selectedCharacter={selectedCharacter}
                firstMove={state.firstMove}
                firstMoveQuery={state.firstMoveQuery}
                firstMoveOptions={firstMoveOptions}
                searchingFirstMoves={searchingFirstMoves}
                enderMove={state.enderMove}
                enderMoveQuery={state.enderMoveQuery}
                enderMoveOptions={enderMoveOptions}
                searchingEnderMoves={searchingEnderMoves}
                query={state.query}
                compactFieldSx={compactFieldSx}
                onCharacterChange={(value) => {
                    selectCharacter(value?.id ?? "");
                    clearFirstMoveOptions();
                    clearEnderMoveOptions();
                }}
                onFirstMoveChange={setFirstMove}
                onFirstMoveQueryChange={setFirstMoveQuery}
                onEnderMoveChange={setEnderMove}
                onEnderMoveQueryChange={setEnderMoveQuery}
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
                        minDifficulty={state.minDifficulty}
                        maxDifficulty={state.maxDifficulty}
                        minDamage={state.minDamage}
                        maxDamage={state.maxDamage}
                        onMinDifficultyChange={setMinDifficulty}
                        onMaxDifficultyChange={setMaxDifficulty}
                        onMinDamageChange={setMinDamage}
                        onMaxDamageChange={setMaxDamage}
                    />

                    <ComboDriveWindowsFiltersSection
                        driveWindows={state.driveWindows}
                        onAddDriveWindow={addDriveWindow}
                        onRemoveDriveWindow={removeDriveWindow}
                        onDriveWindowRangeChange={setDriveWindowRange}
                    />

                    <ComboRequirementsFiltersSection
                        requirements={state.requirements}
                        requirementObjectOptions={requirementObjectOptions}
                        onRequirementToggle={setRequirementToggle}
                        onRequirementObjectChange={setRequirementObject}
                        onAddedObjectChange={setAddedObject}
                        onConsumedObjectChange={setConsumedObject}
                    />
                </AppBox>
            </AppCollapse>
        </AppPaper>
    );
}
