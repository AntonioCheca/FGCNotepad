import React from "react";
import {DialogActions as MUIDialogActions, DialogActionsProps as MUIDialogActionsProps} from "@mui/material";

interface AppDialogActionsProps extends MUIDialogActionsProps {}

export const AppDialogActions: React.FC<AppDialogActionsProps> = ({children, ...props}) => {
    return <MUIDialogActions {...props}>{children}</MUIDialogActions>;
};
