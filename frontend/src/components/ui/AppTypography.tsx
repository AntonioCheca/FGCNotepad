import React from 'react';
import {Typography as MUITypography, TypographyProps as MUITypographyProps} from '@mui/material';

interface AppTypographyProps extends MUITypographyProps {
}

export const AppTypography: React.FC<AppTypographyProps> = ({
                                                                ...props
                                                            }) => {
    return (
        <MUITypography
            {...props}
        />
    );
};