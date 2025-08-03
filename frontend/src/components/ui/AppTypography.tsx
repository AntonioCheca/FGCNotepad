import React from 'react';
import {Typography as MUITypography, TypographyProps as MUITypographyProps} from '@mui/material';


import {useTheme} from "@mui/material/styles";

interface AppTypographyProps extends MUITypographyProps {
}

export const AppTypography: React.FC<AppTypographyProps> = (props) => {
    const theme = useTheme();
    return (
        <MUITypography
            {...props}
            sx={{
                color: theme.palette.text.primary,
                ...props.sx, // ensure sx overrides work
            }}
        />
    );
};

