import React from "react";
import useMoves from "@/hooks/useMoves";
import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {moveOptionLabel, toMoveSearchOptions} from "./okiMoveSearch";

export interface OkiMoveOption {
    id: string;
    summary: string;
    characterId?: string;
    numpadNotation?: string;
    commonName?: string | null;
    moveName?: string | null;
    moveType?: string | null;
    attackLevel?: string | null;
}

interface OkiMovePickerProps {
    label: string;
    value: OkiMoveOption | null;
    characterId?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    // Replaces the plain move search, e.g. with one that only offers enders without an oki.
    search?: (query: string, characterId?: string) => Promise<unknown>;
    onChange: (value: OkiMoveOption | null) => void;
}

export function OkiMovePicker({label, value, characterId, disabled = false, autoFocus = false, search, onChange}: OkiMovePickerProps) {
    const {searchMoves: searchAllMoves} = useMoves();
    const searchMoves = search ?? searchAllMoves;
    const [inputValue, setInputValue] = React.useState(value ? moveOptionLabel(value) : "");
    const [options, setOptions] = React.useState<OkiMoveOption[]>(value ? [value] : []);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (value && !options.some((option) => option.id === value.id)) {
            setOptions((current) => [value, ...current]);
        }
    }, [options, value]);

    React.useEffect(() => {
        const query = inputValue.trim();
        if (disabled || query.length < 2) {
            return;
        }

        let canceled = false;
        const handle = window.setTimeout(() => {
            setLoading(true);
            searchMoves(query, characterId)
                .then((result: unknown) => {
                    if (canceled) {
                        return;
                    }
                    const nextOptions = toMoveSearchOptions(result);
                    setOptions(value ? [value, ...nextOptions.filter((option) => option.id !== value.id)] : nextOptions);
                })
                .catch(() => setOptions(value ? [value] : []))
                .finally(() => {
                    if (!canceled) {
                        setLoading(false);
                    }
                });
        }, 220);

        return () => {
            canceled = true;
            window.clearTimeout(handle);
        };
    }, [characterId, disabled, inputValue, searchMoves, value]);

    return (
        <AppAutocomplete<OkiMoveOption, false, false, false>
            options={options}
            value={value}
            inputValue={inputValue}
            loading={loading}
            disabled={disabled}
            onInputChange={(_, nextValue) => setInputValue(nextValue)}
            onChange={(_, nextValue) => onChange(nextValue)}
            getOptionLabel={moveOptionLabel}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            renderInput={(params) => <AppTextField {...params} autoFocus={autoFocus} label={label} size="small" margin="none" />}
        />
    );
}
