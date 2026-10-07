import React from "react";
import {useCharacters} from "@/hooks/useCharacters";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";

interface CharacterSelectProps {
    label?: string;
    value: string;
    // Search filters offer "Any"; forms require a character.
    allowAny?: boolean;
    required?: boolean;
    disabled?: boolean;
    onChange: (characterId: string) => void;
}

export function CharacterSelect({label = "Character", value, allowAny = false, required = false, disabled = false, onChange}: CharacterSelectProps) {
    const {characters} = useCharacters();
    const labelId = React.useId();

    return (
        <AppFormControl size="small" fullWidth required={required} disabled={disabled}>
            <AppInputLabel id={labelId}>{label}</AppInputLabel>
            {/* Until the character list loads, a preselected id has no option to show. */}
            <AppSelect<string> labelId={labelId} label={label} value={characters.some((character) => character.id === value) ? value : ""} onChange={(event) => onChange(String(event.target.value))}>
                {allowAny ? <AppMenuItem value="">Any</AppMenuItem> : null}
                {characters.map((character) => <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>)}
            </AppSelect>
        </AppFormControl>
    );
}
