import React from "react";
import {IconButton as MUIIconButton, IconButtonProps as MUIIconButtonProps} from "@mui/material";

type AppIconButtonProps = MUIIconButtonProps;

export const AppIconButton: React.FC<AppIconButtonProps> = ({...props}) => {
    return <MUIIconButton {...props} />;
};
