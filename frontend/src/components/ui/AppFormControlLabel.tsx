import React from "react";
import {FormControlLabel as MUIFormControlLabel, FormControlLabelProps as MUIFormControlLabelProps} from "@mui/material";

type AppFormControlLabelProps = MUIFormControlLabelProps;

export const AppFormControlLabel: React.FC<AppFormControlLabelProps> = ({...props}) => {
    return <MUIFormControlLabel {...props} />;
};
