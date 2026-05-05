import React from 'react';
import {Stack as MUIStack, StackProps as MUIStackProps} from '@mui/material';

type AppStackProps = MUIStackProps;

export const AppStack: React.FC<AppStackProps> = ({
                                                      ...props
                                                  }) => {
    return (
        <MUIStack
            {...props}
        />
    );
};
