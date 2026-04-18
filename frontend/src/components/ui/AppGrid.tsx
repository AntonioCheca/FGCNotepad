import React from "react";
import {Grid as MUIGrid, GridProps as MUIGridProps} from "@mui/material";

interface AppGridProps extends MUIGridProps {}

export const AppGrid: React.FC<AppGridProps> = ({...props}) => {
    return <MUIGrid {...props} />;
};
