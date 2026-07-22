import {WrappedAutocomplete} from "@/src/components/ui/WrappedAutocomplete";
import type {DynamicComboCharacterOption} from "./dynamicComboPanelTypes";

interface DynamicComboCharacterFieldProps {
    characterOptions: DynamicComboCharacterOption[];
    charactersLoading: boolean;
    selectedCharacter: DynamicComboCharacterOption | null;
    onSelectedCharacterChange: (value: DynamicComboCharacterOption | null) => void;
}

export function DynamicComboCharacterField({characterOptions, charactersLoading, selectedCharacter, onSelectedCharacterChange}: DynamicComboCharacterFieldProps) {
    return (
        <WrappedAutocomplete<DynamicComboCharacterOption>
            label="Attacker Character"
            options={characterOptions}
            loading={charactersLoading}
            disablePortal
            value={selectedCharacter}
            onChange={onSelectedCharacterChange}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
        />
    );
}
