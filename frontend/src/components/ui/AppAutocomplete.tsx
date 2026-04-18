import React from "react";
import {Autocomplete as MUIAutocomplete, AutocompleteProps as MUIAutocompleteProps} from "@mui/material";

export function AppAutocomplete<
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
>(props: MUIAutocompleteProps<Value, Multiple, DisableClearable, FreeSolo>) {
    return <MUIAutocomplete {...props} />;
}
