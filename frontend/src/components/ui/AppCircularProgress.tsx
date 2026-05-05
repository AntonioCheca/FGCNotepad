import React from 'react';
import {
    CircularProgress as MUICircularProgress,
    CircularProgressProps as MUICircularProgressProps
} from '@mui/material';

type AppCircularProgressProps = MUICircularProgressProps;

export const AppCircularProgress: React.FC<AppCircularProgressProps> = ({
                                                                            ...props
                                                                        }) => {
    return (
        <MUICircularProgress
            {...props}
        />
    );
};
