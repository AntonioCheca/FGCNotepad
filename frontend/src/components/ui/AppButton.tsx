import React from 'react';
import {Button as MUIButton, ButtonProps as MUIButtonProps} from '@mui/material';

interface AppButtonProps extends MUIButtonProps {
}

export const AppButton: React.FC<AppButtonProps> = ({
                                                        type = "submit",
                                                        variant = "contained",
                                                        color = "primary",
                                                        ...props
                                                    }) => {

    return (
        <MUIButton
            type={type}
            variant={variant}
            color={color}
            {...props}
        />
    );
};