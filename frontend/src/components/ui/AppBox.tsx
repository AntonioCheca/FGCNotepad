import React from 'react';
import {Box as MUIBox, BoxProps as MUIBoxProps} from '@mui/material';

interface AppBoxProps extends MUIBoxProps {
}

export const AppBox: React.FC<AppBoxProps> = ({
                                                  ...props
                                              }) => {
    return (
        <MUIBox
            {...props}
        />
    );
};