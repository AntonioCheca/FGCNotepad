import React from "react";
import {Tab as MUITab, TabProps as MUITabProps, Tabs as MUITabs, TabsProps as MUITabsProps} from "@mui/material";

export const AppTabs: React.FC<MUITabsProps> = (props) => {
    return <MUITabs {...props} />;
};

export const AppTab: React.FC<MUITabProps> = (props) => {
    return <MUITab {...props} />;
};
