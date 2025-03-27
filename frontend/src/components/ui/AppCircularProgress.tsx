import React from 'react';
import {
    CircularProgress as MUICircularProgress,
    CircularProgressProps as MUICircularProgressProps
} from '@mui/material';

interface AppCircularProgressProps extends MUICircularProgressProps {
}

export const AppCircularProgress: React.FC<AppCircularProgressProps> = ({
                                                                            ...props
                                                                        }) => {
    return (
        <MUICircularProgress
            {...props}
        />
    );
};