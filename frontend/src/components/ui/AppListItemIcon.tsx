import React from "react";
import {ListItemIcon as MUIListItemIcon, ListItemIconProps as MUIListItemIconProps} from "@mui/material";

interface AppListItemIconProps extends MUIListItemIconProps {}

export const AppListItemIcon: React.FC<AppListItemIconProps> = ({...props}) => {
    return <MUIListItemIcon {...props} />;
};
