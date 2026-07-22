import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {ScenarioCharacterOption, ScenarioTriggerMoveOption} from "../scenarioSearchTypes";

interface ScenarioPrimaryFiltersSectionProps {
    characterOptions: ScenarioCharacterOption[];
    selectedAttacker: ScenarioCharacterOption | null;
    selectedDefender: ScenarioCharacterOption | null;
    triggerMoveSelection: ScenarioTriggerMoveOption | null;
    triggerMoveInput: string;
    triggerMoveOptions: ScenarioTriggerMoveOption[];
    searchingMoves: boolean;
    compactFieldSx: object;
    onAttackerChange: (value: ScenarioCharacterOption | null) => void;
    onTriggerMoveChange: (value: ScenarioTriggerMoveOption | null) => void;
    onTriggerMoveInputChange: (value: string) => void;
    onDefenderChange: (value: ScenarioCharacterOption | null) => void;
}

export function ScenarioPrimaryFiltersSection({
    characterOptions,
    selectedAttacker,
    selectedDefender,
    triggerMoveSelection,
    triggerMoveInput,
    triggerMoveOptions,
    searchingMoves,
    compactFieldSx,
    onAttackerChange,
    onTriggerMoveChange,
    onTriggerMoveInputChange,
    onDefenderChange,
}: ScenarioPrimaryFiltersSectionProps) {
    return (
        <SectionCard title="Primary Filters" description="Set attacker first, then trigger move. Scenario results refresh automatically." tone="raised" variant="input">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(250px, 1fr) minmax(320px, 1.3fr) minmax(250px, 1fr)"}, gap: 1}}>
                <AppAutocomplete<ScenarioCharacterOption, false, false, false>
                    options={characterOptions}
                    value={selectedAttacker}
                    onChange={(_, value) => onAttackerChange(value)}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => <AppTextField {...params} label="Attacker" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                />

                <AppAutocomplete<ScenarioTriggerMoveOption, false, false, false>
                    options={triggerMoveOptions}
                    value={triggerMoveSelection}
                    inputValue={triggerMoveInput}
                    loading={searchingMoves}
                    filterOptions={(options) => options}
                    onChange={(_, value) => onTriggerMoveChange(value)}
                    onInputChange={(_, value) => onTriggerMoveInputChange(value)}
                    getOptionLabel={(option) => option.summary}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText="No moves found"
                    renderInput={(params) => <AppTextField {...params} label="Trigger move" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                />

                <AppAutocomplete<ScenarioCharacterOption, false, false, false>
                    options={characterOptions}
                    value={selectedDefender}
                    onChange={(_, value) => onDefenderChange(value)}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => <AppTextField {...params} label="Defender" size="small" InputLabelProps={{shrink: true}} sx={compactFieldSx} />}
                />
            </AppBox>
        </SectionCard>
    );
}
