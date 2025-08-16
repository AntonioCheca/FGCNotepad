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
    /** Single-select only */
    onChange: (value: T | null) => void;
    getOptionLabel: (option: T) => string;
    isOptionEqualToValue?: (option: T, value: T) => boolean;

    /** Controlled input support (for async search) */
    inputValue?: string;
    onInputChange?: (
        event: React.SyntheticEvent,
        value: string,
        reason: AutocompleteInputChangeReason
    ) => void;

    placeholder?: string;
    required?: boolean; // ✅ add this
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
                    required={required} // ✅ forward it
                />
            )}
        />
    );
}
