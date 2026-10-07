import React from "react";
import {ToggleButtonGroup as MUIToggleButtonGroup, ToggleButtonGroupProps as MUIToggleButtonGroupProps} from "@mui/material";

type AppToggleButtonGroupProps = MUIToggleButtonGroupProps;

export const AppToggleButtonGroup: React.FC<AppToggleButtonGroupProps> = (props) => {
    return <MUIToggleButtonGroup {...props} />;
};
