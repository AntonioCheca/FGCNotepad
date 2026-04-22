import React from "react";
import {Tooltip as MUITooltip, TooltipProps as MUITooltipProps} from "@mui/material";

interface AppTooltipProps extends MUITooltipProps {
}

export const AppTooltip: React.FC<AppTooltipProps> = ({children, ...props}) => {
    return <MUITooltip {...props}>{children}</MUITooltip>;
};
