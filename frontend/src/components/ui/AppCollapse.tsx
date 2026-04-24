import React from "react";
import {Collapse as MUICollapse, CollapseProps as MUICollapseProps} from "@mui/material";

type AppCollapseProps = MUICollapseProps;

export const AppCollapse: React.FC<AppCollapseProps> = (props) => {
    return <MUICollapse {...props} />;
};
