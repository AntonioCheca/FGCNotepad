import React from "react";
import {FormControlLabel as MUIFormControlLabel, FormControlLabelProps as MUIFormControlLabelProps} from "@mui/material";

interface AppFormControlLabelProps extends MUIFormControlLabelProps {}

export const AppFormControlLabel: React.FC<AppFormControlLabelProps> = ({...props}) => {
    return <MUIFormControlLabel {...props} />;
};
