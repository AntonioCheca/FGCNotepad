import React from 'react';
import {Divider as MUIDivider, DividerProps as MUIDividerProps} from '@mui/material';

interface AppDividerProps extends MUIDividerProps {
}

export const AppDivider: React.FC<AppDividerProps> = ({
                                                          ...props
                                                      }) => {
    return (
        <MUIDivider
            {...props}
        />
    );
};