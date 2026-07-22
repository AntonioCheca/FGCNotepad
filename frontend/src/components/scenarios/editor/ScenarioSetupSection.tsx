import {AppBox} from "@/src/components/ui/AppBox";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {ScenarioType} from "@/hooks/useScenarios";
import type {CharacterOption, MoveOption} from "./scenarioEditorTypes";

interface ScenarioSetupSectionProps {
    name: string;
    scenarioType: ScenarioType;
    characterOptions: CharacterOption[];
    selectedAttacker: CharacterOption | null;
    selectedDefender: CharacterOption | null;
    triggerMove: MoveOption | null;
    triggerMoveQuery: string;
    moveOptions: MoveOption[];
    charactersLoading: boolean;
    isSearchingMoves: boolean;
    attackerCharacterId: string;
    onNameChange: (value: string) => void;
    onScenarioTypeChange: (value: ScenarioType) => void;
    onAttackerChange: (value: CharacterOption | null) => void;
    onTriggerMoveChange: (value: MoveOption | null) => void;
    onTriggerMoveQueryChange: (value: string) => void;
    onDefenderChange: (value: CharacterOption | null) => void;
}

export function ScenarioSetupSection({
    name,
    scenarioType,
    characterOptions,
    selectedAttacker,
    selectedDefender,
    triggerMove,
    triggerMoveQuery,
    moveOptions,
    charactersLoading,
    isSearchingMoves,
    attackerCharacterId,
    onNameChange,
    onScenarioTypeChange,
    onAttackerChange,
    onTriggerMoveChange,
    onTriggerMoveQueryChange,
    onDefenderChange,
}: ScenarioSetupSectionProps) {
    return (
        <SectionCard
            title="Scenario Setup"
            tone="default"
            variant="input"
        >
            <AppBox sx={{display: "grid", gap: 1}}>
                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(0, 1fr) 220px"}, gap: 1, alignItems: "stretch"}}>
                    <AppTextField label="Scenario Name" value={name} onChange={(event) => onNameChange(event.target.value)} required size="small" />

                    <AppFormControl size="small">
                        <AppInputLabel id="scenario-type-label">Scenario Type</AppInputLabel>
                        <AppSelect labelId="scenario-type-label" label="Scenario Type" value={scenarioType} onChange={(event) => onScenarioTypeChange(event.target.value as ScenarioType)}>
                            <AppMenuItem value="oki">Oki</AppMenuItem>
                            <AppMenuItem value="aggregated_oki">Aggregated Oki</AppMenuItem>
                            <AppMenuItem value="blockstun">Blockstun</AppMenuItem>
                        </AppSelect>
                    </AppFormControl>
                </AppBox>

                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "minmax(240px, 1fr) minmax(300px, 1.3fr) minmax(240px, 1fr)"}, gap: 1}}>
                    <WrappedAutocomplete<CharacterOption>
                        label="Attacker Character"
                        options={characterOptions}
                        value={selectedAttacker}
                        loading={charactersLoading}
                        disableClearable={false}
                        getOptionLabel={(option) => option?.name ?? ""}
                        onChange={onAttackerChange}
                    />

                    <WrappedAutocomplete<MoveOption>
                        label="Trigger Move"
                        value={triggerMove}
                        options={moveOptions}
                        loading={isSearchingMoves}
                        getOptionLabel={(option) => option.summary}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        onChange={onTriggerMoveChange}
                        disabled={!attackerCharacterId}
                        openOnFocus
                        inputValue={attackerCharacterId ? triggerMoveQuery : ""}
                        onInputChange={(_event, value) => {
                            if (!attackerCharacterId) {
                                return;
                            }

                            onTriggerMoveQueryChange(value);
                        }}
                        noOptionsText={!attackerCharacterId ? "Select attacker first" : "No moves found"}
                    />

                    <WrappedAutocomplete<CharacterOption>
                        label="Defender Character"
                        options={characterOptions}
                        value={selectedDefender}
                        loading={charactersLoading}
                        disableClearable={false}
                        getOptionLabel={(option) => option?.name ?? ""}
                        onChange={onDefenderChange}
                    />
                </AppBox>
            </AppBox>
        </SectionCard>
    );
}
