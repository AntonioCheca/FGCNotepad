import React from "react";
import {Checkbox as MUICheckbox, CheckboxProps as MUICheckboxProps} from "@mui/material";

type AppCheckboxProps = MUICheckboxProps;

export const AppCheckbox: React.FC<AppCheckboxProps> = ({...props}) => {
    return <MUICheckbox {...props} />;
};
