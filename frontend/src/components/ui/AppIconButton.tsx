import React from "react";
import {IconButton as MUIIconButton, IconButtonProps as MUIIconButtonProps} from "@mui/material";

interface AppIconButtonProps extends MUIIconButtonProps {}

export const AppIconButton: React.FC<AppIconButtonProps> = ({...props}) => {
    return <MUIIconButton {...props} />;
};
