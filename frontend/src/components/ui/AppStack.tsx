import React from 'react';
import {Stack as MUIStack, StackProps as MUIStackProps} from '@mui/material';

interface AppStackProps extends MUIStackProps {
}

export const AppStack: React.FC<AppStackProps> = ({
                                                      ...props
                                                  }) => {
    return (
        <MUIStack
            {...props}
        />
    );
};