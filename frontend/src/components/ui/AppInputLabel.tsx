import React from 'react';
import {InputLabel as MUIInputLabel, InputLabelProps as MUIInputLabelProps} from '@mui/material';

export interface AppInputLabelProps extends MUIInputLabelProps {
}

export const AppInputLabel: React.FC<AppInputLabelProps> = (props) => {
    return <MUIInputLabel {...props} />;
};
