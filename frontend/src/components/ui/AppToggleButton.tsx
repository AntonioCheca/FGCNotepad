import React from "react";
import {ToggleButton as MUIToggleButton, ToggleButtonProps as MUIToggleButtonProps} from "@mui/material";

type AppToggleButtonProps = MUIToggleButtonProps;

export const AppToggleButton: React.FC<AppToggleButtonProps> = (props) => {
    return <MUIToggleButton {...props} />;
};
