import React from "react";
import {Autocomplete, TextField, CircularProgress} from "@mui/material";

interface WrappedAutocompleteProps<T> {
    options?: T[];
    value: T | T[] | null;
    onChange: (event: React.SyntheticEvent, value: T | T[] | null) => void;
    loading?: boolean;
    label: string;
    multiple?: boolean;
    getOptionLabel?: (option: T) => string;
    disabled?: boolean;
    required?: boolean;
    // Other props you want to pass down to Autocomplete or TextField can be added here
}

export function WrappedAutocomplete<T>(props: WrappedAutocompleteProps<T>) {
    const {
        options = [],
        value,
        onChange,
        loading = false,
        label,
        multiple = false,
        getOptionLabel = (option) => (typeof option === "string" ? option : JSON.stringify(option)),
        disabled = false,
        required = false,
        ...other
    } = props;

    // Optional debug log to trace props changes - comment out when not needed
    // React.useEffect(() => {
    //   console.log("[WrappedAutocomplete] value:", value);
    //   console.log("[WrappedAutocomplete] options:", options);
    //   console.log("[WrappedAutocomplete] loading:", loading);
    // }, [value, options, loading]);

    return (
        <Autocomplete
            {...other}
            options={options}
            value={value}
            onChange={onChange}
            loading={loading}
            multiple={multiple}
            getOptionLabel={getOptionLabel}
            disabled={disabled}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    required={required}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20}/> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
}
