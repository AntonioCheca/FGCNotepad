import React from "react";
import {DialogTitle as MUIDialogTitle, DialogTitleProps as MUIDialogTitleProps} from "@mui/material";

interface AppDialogTitleProps extends MUIDialogTitleProps {}

export const AppDialogTitle: React.FC<AppDialogTitleProps> = ({children, ...props}) => {
    return <MUIDialogTitle {...props}>{children}</MUIDialogTitle>;
};
