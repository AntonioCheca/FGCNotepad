import React from "react";
import {
    Autocomplete,
    AutocompleteProps,
    AutocompleteInputChangeReason,
    TextField,
} from "@mui/material";

type WrappedAutocompleteProps<T> = {
    label: string;
    options: T[];
    value: T | null;
    onChange: (value: T | null) => void;
    getOptionLabel: (option: T) => string;
    isOptionEqualToValue?: (option: T, value: T) => boolean;

    inputValue?: string;
    onInputChange?: (
        event: React.SyntheticEvent,
        value: string,
        reason: AutocompleteInputChangeReason
    ) => void;

    placeholder?: string;
    required?: boolean;
} & Omit<
    AutocompleteProps<T, false, false, false>,
    | "renderInput"
    | "options"
    | "value"
    | "onChange"
    | "getOptionLabel"
    | "isOptionEqualToValue"
    | "inputValue"
    | "onInputChange"
>;

export function WrappedAutocomplete<T>({
                                           label,
                                           options,
                                           value,
                                           onChange,
                                           getOptionLabel,
                                           isOptionEqualToValue,
                                           inputValue,
                                           onInputChange,
                                           placeholder,
                                           required,
                                           ...rest
                                       }: WrappedAutocompleteProps<T>) {
    return (
        <Autocomplete<T, false, false, false>
            {...rest}
            options={options}
            value={value}
            onChange={(_, newValue) => onChange(newValue)}
            getOptionLabel={(option) =>
                typeof option === "string" ? option : getOptionLabel(option)
            }
            isOptionEqualToValue={isOptionEqualToValue ?? ((a, b) => a === b)}
            inputValue={inputValue}
            onInputChange={onInputChange}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    required={required}
                />
            )}
        />
    );
}
