import React from 'react';
import {Typography as MUITypography, TypographyProps as MUITypographyProps} from '@mui/material';

interface AppTypographyProps extends MUITypographyProps {
}

export const AppTypography: React.FC<AppTypographyProps> = (props) => {
    const {sx, color, ...rest} = props;

    return (
        <MUITypography
            {...rest}
            color={color ?? 'text.primary'}
            sx={sx}
        />
    );
};

