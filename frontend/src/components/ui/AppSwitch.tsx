import React from "react";
import {Switch as MUISwitch, SwitchProps as MUISwitchProps} from "@mui/material";

type AppSwitchProps = MUISwitchProps;

export const AppSwitch: React.FC<AppSwitchProps> = ({...props}) => {
    return <MUISwitch {...props} />;
};
