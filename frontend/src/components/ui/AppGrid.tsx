import React from "react";
import {Grid as MUIGrid, GridProps as MUIGridProps} from "@mui/material";

type AppGridProps = MUIGridProps;

export const AppGrid: React.FC<AppGridProps> = ({...props}) => {
    return <MUIGrid {...props} />;
};
