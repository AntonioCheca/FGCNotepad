import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {ComboCharacterOption, ComboMoveSearchOption} from "./comboFilterTypes";

interface ComboPrimaryFiltersSectionProps {
    characterOptions: ComboCharacterOption[];
    selectedCharacter: ComboCharacterOption | null;
    firstMove: ComboMoveSearchOption | null;
    firstMoveQuery: string;
    firstMoveOptions: ComboMoveSearchOption[];
    searchingFirstMoves: boolean;
    enderMove: ComboMoveSearchOption | null;
    enderMoveQuery: string;
    enderMoveOptions: ComboMoveSearchOption[];
    searchingEnderMoves: boolean;
    query: string;
    compactFieldSx: object;
    onCharacterChange: (value: ComboCharacterOption | null) => void;
    onFirstMoveChange: (value: ComboMoveSearchOption | null) => void;
    onFirstMoveQueryChange: (value: string) => void;
    onEnderMoveChange: (value: ComboMoveSearchOption | null) => void;
    onEnderMoveQueryChange: (value: string) => void;
    onQueryChange: (value: string) => void;
}

export function ComboPrimaryFiltersSection({
    characterOptions,
    selectedCharacter,
    firstMove,
    firstMoveQuery,
    firstMoveOptions,
    searchingFirstMoves,
    enderMove,
    enderMoveQuery,
    enderMoveOptions,
    searchingEnderMoves,
    query,
    compactFieldSx,
    onCharacterChange,
    onFirstMoveChange,
    onFirstMoveQueryChange,
    onEnderMoveChange,
    onEnderMoveQueryChange,
    onQueryChange,
}: ComboPrimaryFiltersSectionProps) {
    return (
        <SectionCard title="Primary Filters" tone="raised" variant="input">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(180px, 0.85fr) minmax(220px, 1fr) minmax(220px, 1fr) minmax(180px, 0.8fr)"}, gap: 1}}>
                <AppAutocomplete<ComboCharacterOption, false, false, false>
                    options={characterOptions}
                    value={selectedCharacter}
                    onChange={(_, value) => onCharacterChange(value)}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => <AppTextField {...params} label="Character" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                />

                <AppAutocomplete<ComboMoveSearchOption, false, false, false>
                    options={firstMoveOptions}
                    value={firstMove}
                    inputValue={firstMoveQuery}
                    loading={searchingFirstMoves}
                    filterOptions={(options) => options}
                    onChange={(_, value) => onFirstMoveChange(value)}
                    onInputChange={(_, value) => onFirstMoveQueryChange(value)}
                    getOptionLabel={(option) => option.summary}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText="No moves found"
                    renderInput={(params) => <AppTextField {...params} label="First move" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                />

                <AppAutocomplete<ComboMoveSearchOption, false, false, false>
                    options={enderMoveOptions}
                    value={enderMove}
                    inputValue={enderMoveQuery}
                    loading={searchingEnderMoves}
                    filterOptions={(options) => options}
                    onChange={(_, value) => onEnderMoveChange(value)}
                    onInputChange={(_, value) => onEnderMoveQueryChange(value)}
                    getOptionLabel={(option) => option.summary}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText="No moves found"
                    renderInput={(params) => <AppTextField {...params} label="Ender move" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                />

                <AppTextField label="Search title" value={query} onChange={(event) => onQueryChange(event.target.value)} size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />
            </AppBox>
        </SectionCard>
    );
}
