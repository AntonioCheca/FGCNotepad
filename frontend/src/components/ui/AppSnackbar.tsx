import React from "react";
import {Snackbar as MUISnackbar, SnackbarProps as MUISnackbarProps} from "@mui/material";

type AppSnackbarProps = MUISnackbarProps;

export const AppSnackbar: React.FC<AppSnackbarProps> = (props) => {
    return <MUISnackbar {...props} />;
};
