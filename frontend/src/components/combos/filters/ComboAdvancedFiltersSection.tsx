import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {MOVE_TYPE_LABELS, MOVE_TYPE_VALUES} from "./comboFilterConstants";
import type {ComboMoveType, ComboSortMode} from "./comboFilterTypes";

interface ComboAdvancedFiltersSectionProps {
    sort: ComboSortMode;
    moveTypes: ComboMoveType[];
    minDifficulty: string;
    maxDifficulty: string;
    minDamage: string;
    maxDamage: string;
    onSortChange: (value: ComboSortMode) => void;
    onMoveTypesChange: (value: ComboMoveType[]) => void;
    onMinDifficultyChange: (value: string) => void;
    onMaxDifficultyChange: (value: string) => void;
    onMinDamageChange: (value: string) => void;
    onMaxDamageChange: (value: string) => void;
}

export function ComboAdvancedFiltersSection({
    sort,
    moveTypes,
    minDifficulty,
    maxDifficulty,
    minDamage,
    maxDamage,
    onSortChange,
    onMoveTypesChange,
    onMinDifficultyChange,
    onMaxDifficultyChange,
    onMinDamageChange,
    onMaxDamageChange,
}: ComboAdvancedFiltersSectionProps) {
    return (
        <SectionCard title="Execution and Damage" description="Optional range and move composition tuning." tone="default" variant="review">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(180px, 0.8fr) minmax(240px, 1.2fr) repeat(4, minmax(120px, 1fr))"}, gap: 1}}>
                <AppTextField select label="Sort" size="small" value={sort} onChange={(event) => onSortChange(event.target.value as ComboSortMode)}>
                    <AppMenuItem value="resourceAdjustedDamage">Resource-adjusted</AppMenuItem>
                    <AppMenuItem value="created">Created order</AppMenuItem>
                </AppTextField>
                <AppAutocomplete<ComboMoveType, true, false, false>
                    multiple
                    options={MOVE_TYPE_VALUES}
                    value={moveTypes}
                    filterOptions={(options) => options}
                    onChange={(_, value) => onMoveTypesChange([...value])}
                    getOptionLabel={(option) => MOVE_TYPE_LABELS[option]}
                    isOptionEqualToValue={(option, value) => option === value}
                    renderInput={(params) => <AppTextField {...params} label="Contains move type" size="small" />}
                />
                <AppTextField label="Min difficulty" type="number" size="small" value={minDifficulty} onChange={(event) => onMinDifficultyChange(event.target.value)} />
                <AppTextField label="Max difficulty" type="number" size="small" value={maxDifficulty} onChange={(event) => onMaxDifficultyChange(event.target.value)} />
                <AppTextField label="Min damage" type="number" size="small" value={minDamage} onChange={(event) => onMinDamageChange(event.target.value)} />
                <AppTextField label="Max damage" type="number" size="small" value={maxDamage} onChange={(event) => onMaxDamageChange(event.target.value)} />
            </AppBox>
        </SectionCard>
    );
}
