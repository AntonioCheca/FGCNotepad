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
    searchingMoves: boolean;
    query: string;
    compactFieldSx: object;
    onCharacterChange: (value: ComboCharacterOption | null) => void;
    onFirstMoveChange: (value: ComboMoveSearchOption | null) => void;
    onFirstMoveQueryChange: (value: string) => void;
    onQueryChange: (value: string) => void;
}

export function ComboPrimaryFiltersSection({
    characterOptions,
    selectedCharacter,
    firstMove,
    firstMoveQuery,
    firstMoveOptions,
    searchingMoves,
    query,
    compactFieldSx,
    onCharacterChange,
    onFirstMoveChange,
    onFirstMoveQueryChange,
    onQueryChange,
}: ComboPrimaryFiltersSectionProps) {
    return (
        <SectionCard title="Primary Filters" description="Set character first, then opener. Results refresh automatically." tone="raised" variant="input">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(260px, 1fr) minmax(320px, 1.3fr) minmax(220px, 0.9fr)"}, gap: 1}}>
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
                    loading={searchingMoves}
                    filterOptions={(options) => options}
                    onChange={(_, value) => onFirstMoveChange(value)}
                    onInputChange={(_, value) => onFirstMoveQueryChange(value)}
                    getOptionLabel={(option) => option.summary}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText="No moves found"
                    renderInput={(params) => <AppTextField {...params} label="First move" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                />

                <AppTextField label="Search title" value={query} onChange={(event) => onQueryChange(event.target.value)} size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />
            </AppBox>
        </SectionCard>
    );
}
