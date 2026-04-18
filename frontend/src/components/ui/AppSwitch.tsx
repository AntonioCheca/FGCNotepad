import React from "react";
import {Switch as MUISwitch, SwitchProps as MUISwitchProps} from "@mui/material";

interface AppSwitchProps extends MUISwitchProps {}

export const AppSwitch: React.FC<AppSwitchProps> = ({...props}) => {
    return <MUISwitch {...props} />;
};
