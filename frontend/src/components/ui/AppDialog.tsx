import React from "react";
import {Dialog as MUIDialog, DialogProps as MUIDialogProps} from "@mui/material";

type AppDialogProps = MUIDialogProps;

export const AppDialog: React.FC<AppDialogProps> = ({...props}) => {
    return <MUIDialog {...props} />;
};
