import React from "react";
import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppTextField} from "@/src/components/ui/AppTextField";
import type {NeutralCharacterOption} from "@/src/types/neutralStats";

interface NeutralCharacterFieldProps {
    label: string;
    placeholder?: string;
    characters: NeutralCharacterOption[];
    value: string | null;
    onChange: (characterId: string | null) => void;
}

export function NeutralCharacterField({label, placeholder, characters, value, onChange}: NeutralCharacterFieldProps) {
    const selected = characters.find((character) => character.id === value) ?? null;

    return (
        <AppAutocomplete<NeutralCharacterOption, false, false, false>
            options={characters}
            value={selected}
            onChange={(_, character) => onChange(character?.id ?? null)}
            getOptionLabel={(character) => character.name}
            isOptionEqualToValue={(option, current) => option.id === current.id}
            renderInput={(params) => <AppTextField {...params} label={label} placeholder={placeholder} size="small" InputLabelProps={{shrink: true}} />}
        />
    );
}
