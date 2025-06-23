import React from 'react';
import {TextField as MUITextField, TextFieldProps as MUITextFieldProps} from '@mui/material';

interface AppTextFieldProps extends MUITextFieldProps {
}

export const AppTextField: React.FC<AppTextFieldProps> = ({
                                                              margin = "normal",
                                                              variant = "outlined",
                                                              ...props
                                                          }) => {
    return (
        <MUITextField
            fullWidth
            margin={margin}
            variant={variant}
            {...props}
        />
    );
};
