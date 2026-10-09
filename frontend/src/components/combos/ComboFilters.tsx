import React from "react";

import {useCharacters} from "@/hooks/useCharacters";
import useCombos from "@/hooks/useCombos";
import useComboSpacings from "@/hooks/useComboSpacings";
import useMoves from "@/hooks/useMoves";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppCollapse} from "@/src/components/ui/AppCollapse";
import {ComboAdvancedFiltersSection} from "./filters/ComboAdvancedFiltersSection";
import {ComboKeyFiltersSection} from "./filters/ComboKeyFiltersSection";
import {ComboPrimaryFiltersSection} from "./filters/ComboPrimaryFiltersSection";
import {DEFAULT_COMBO_FILTER_SORT} from "./filters/comboFilterConstants";
import type {ComboFiltersProps, ComboSearchFilters} from "./filters/comboFilterTypes";
import {buildComboSearchFilters, normalizeCharacterOptions, normalizeRequirementObjectOptions} from "./filters/comboFilterUtils";
import {useComboFilterState} from "./filters/useComboFilterState";
import {useComboMoveSearch} from "./filters/useComboMoveSearch";
import type {RequirementObjectOption} from "@/src/types/combo";

export type {ComboSearchFilters};

const EMPTY_INITIAL_FILTERS: ComboSearchFilters = {};

export default function ComboFilters({onChange, initialFilters = EMPTY_INITIAL_FILTERS}: ComboFiltersProps) {
    const {characters} = useCharacters();
    const {searchMoves} = useMoves();
    const {fetchRequirementObjects} = useCombos();
    const {spacings: spacingOptions, fetchComboSpacings} = useComboSpacings();
    const {
        state,
        setQuery,
        selectCharacter,
        setFirstMove,
        setFirstMoveQuery,
        setEnderMove,
        setEnderMoveQuery,
        setMinDamage,
        setMaxDamage,
        setAvailableDrive,
        setAvailableSuper,
        setSpacingCodes,
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
    const characterRequirementObjectOptions = React.useMemo(
        () => selectedCharacter
            ? requirementObjectOptions.filter((option) => option.character_name.toLowerCase() === selectedCharacter.name.toLowerCase())
            : requirementObjectOptions,
        [requirementObjectOptions, selectedCharacter],
    );
    const normalizedFilters = React.useMemo(() => buildComboSearchFilters(state), [state]);

    React.useEffect(() => {
        fetchComboSpacings().catch(() => undefined);

        fetchRequirementObjects()
            .then((result: unknown) => setRequirementObjectOptions(normalizeRequirementObjectOptions(result)))
            .catch(() => setRequirementObjectOptions([]));
    }, [fetchComboSpacings, fetchRequirementObjects]);

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            onChange({...initialFilters, ...normalizedFilters});
        }, 240);

        return () => {
            window.clearTimeout(handle);
        };
    }, [initialFilters, normalizedFilters, onChange]);

    const handleClearFilters = React.useCallback(() => {
        clearFilters();
        clearFirstMoveOptions();
        clearEnderMoveOptions();
        onChange({sort: DEFAULT_COMBO_FILTER_SORT});
    }, [clearEnderMoveOptions, clearFilters, clearFirstMoveOptions, onChange]);

    return (
        <AppBox sx={{display: "grid", gap: 1.25, mb: {xs: 1, md: 1.5}}}>
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

            <ComboKeyFiltersSection
                requirements={state.requirements}
                spacingOptions={spacingOptions}
                spacingCodes={state.spacingCodes}
                availableDrive={state.availableDrive}
                availableSuper={state.availableSuper}
                onRequirementToggle={setRequirementToggle}
                onSpacingCodesChange={setSpacingCodes}
                onAvailableDriveChange={setAvailableDrive}
                onAvailableSuperChange={setAvailableSuper}
            />

            <AppCollapse in={state.showAdvancedFilters} timeout={200} unmountOnExit>
                <ComboAdvancedFiltersSection
                    requirements={state.requirements}
                    requirementObjectOptions={characterRequirementObjectOptions}
                    driveWindows={state.driveWindows}
                    minDamage={state.minDamage}
                    maxDamage={state.maxDamage}
                    onRequirementToggle={setRequirementToggle}
                    onRequirementObjectChange={setRequirementObject}
                    onAddedObjectChange={setAddedObject}
                    onConsumedObjectChange={setConsumedObject}
                    onAddDriveWindow={addDriveWindow}
                    onRemoveDriveWindow={removeDriveWindow}
                    onDriveWindowRangeChange={setDriveWindowRange}
                    onMinDamageChange={setMinDamage}
                    onMaxDamageChange={setMaxDamage}
                />
            </AppCollapse>

            <AppBox sx={{display: "flex", gap: 1, flexWrap: "wrap", "& .MuiButton-root": {flex: {xs: "1 1 0", sm: "0 0 auto"}}}}>
                <AppButton type="button" variant="text" color="secondary" onClick={toggleAdvancedFilters} aria-expanded={state.showAdvancedFilters}>
                    {state.showAdvancedFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
                </AppButton>
                <AppButton type="button" variant="text" color="secondary" onClick={handleClearFilters}>Clear Filters</AppButton>
            </AppBox>
        </AppBox>
    );
}
