import React from "react";
import {
    Select as MUISelect,
    SelectProps as MUISelectProps,
    SelectChangeEvent
} from "@mui/material";

export interface AppSelectProps<T = unknown>
    extends Omit<MUISelectProps<T>, "onChange" | "value"> {
    value: T;
    onChange: (event: SelectChangeEvent<T>, child: React.ReactNode) => void;
}

export function AppSelect<T = unknown>({
                                           value,
                                           onChange,
                                           ...props
                                       }: AppSelectProps<T>) {
    return (
        <MUISelect<T>
            value={value}
            onChange={onChange}
            {...props}
        />
    );
}
