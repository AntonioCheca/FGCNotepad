import React from 'react';
import {FormControl as MUIFormControl, FormControlProps as MUIFormControlProps} from '@mui/material';

export type AppFormControlProps = MUIFormControlProps;

export const AppFormControl: React.FC<AppFormControlProps> = (props) => {
    return <MUIFormControl {...props} />;
};
