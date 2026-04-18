import React from "react";
import {ListItemButton as MUIListItemButton, ListItemButtonProps as MUIListItemButtonProps} from "@mui/material";

interface AppListItemButtonProps extends MUIListItemButtonProps {}

export const AppListItemButton: React.FC<AppListItemButtonProps> = ({...props}) => {
    return <MUIListItemButton {...props} />;
};
