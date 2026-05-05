import React from "react";
import {DialogActions as MUIDialogActions, DialogActionsProps as MUIDialogActionsProps} from "@mui/material";

type AppDialogActionsProps = MUIDialogActionsProps;

export const AppDialogActions: React.FC<AppDialogActionsProps> = ({children, ...props}) => {
    return <MUIDialogActions {...props}>{children}</MUIDialogActions>;
};
