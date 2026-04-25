import React from "react";
import {DialogContent as MUIDialogContent, DialogContentProps as MUIDialogContentProps} from "@mui/material";

interface AppDialogContentProps extends MUIDialogContentProps {}

export const AppDialogContent: React.FC<AppDialogContentProps> = ({children, ...props}) => {
    return <MUIDialogContent {...props}>{children}</MUIDialogContent>;
};
