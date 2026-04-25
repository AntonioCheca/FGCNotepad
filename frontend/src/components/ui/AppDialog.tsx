import React from "react";
import {Dialog as MUIDialog, DialogProps as MUIDialogProps} from "@mui/material";

interface AppDialogProps extends MUIDialogProps {}

export const AppDialog: React.FC<AppDialogProps> = ({...props}) => {
    return <MUIDialog {...props} />;
};
