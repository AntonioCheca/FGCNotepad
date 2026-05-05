import React from "react";
import {ListItemIcon as MUIListItemIcon, ListItemIconProps as MUIListItemIconProps} from "@mui/material";

type AppListItemIconProps = MUIListItemIconProps;

export const AppListItemIcon: React.FC<AppListItemIconProps> = ({...props}) => {
    return <MUIListItemIcon {...props} />;
};
