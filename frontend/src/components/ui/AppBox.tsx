import React from 'react';
import {Box as MUIBox, BoxProps as MUIBoxProps} from '@mui/material';

type AppBoxProps = MUIBoxProps;

export const AppBox: React.FC<AppBoxProps> = ({
                                                  ...props
                                              }) => {
    return (
        <MUIBox
            {...props}
        />
    );
};
