import React from "react";
import useMoves from "@/hooks/useMoves";
import {AppAutocomplete} from "@/src/components/ui/AppAutocomplete";
import {AppTextField} from "@/src/components/ui/AppTextField";

export interface OkiMoveOption {
    id: string;
    summary: string;
    characterId?: string;
}

interface OkiMovePickerProps {
    label: string;
    value: OkiMoveOption | null;
    characterId?: string;
    disabled?: boolean;
    onChange: (value: OkiMoveOption | null) => void;
}

export function OkiMovePicker({label, value, characterId, disabled = false, onChange}: OkiMovePickerProps) {
    const {searchMoves} = useMoves();
    const [inputValue, setInputValue] = React.useState(value?.summary ?? "");
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
                    const nextOptions = Array.isArray(result)
                        ? result
                            .filter((item): item is {id: string | number; summary: string; character?: {id?: string}} => typeof item === "object" && item !== null && "id" in item && "summary" in item)
                            .map((item) => ({id: String(item.id), summary: item.summary, characterId: item.character?.id}))
                        : [];
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
            getOptionLabel={(option) => option.summary}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            renderInput={(params) => <AppTextField {...params} label={label} size="small" />}
        />
    );
}
