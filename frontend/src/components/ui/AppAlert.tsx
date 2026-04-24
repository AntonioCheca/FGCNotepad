import React from "react";
import {Alert as MUIAlert, AlertProps as MUIAlertProps} from "@mui/material";

type AppAlertProps = MUIAlertProps;

export const AppAlert: React.FC<AppAlertProps> = ({...props}) => {
    return <MUIAlert {...props} />;
};
