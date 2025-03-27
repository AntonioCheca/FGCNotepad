import React from 'react';
import {TableContainer as MUITableContainer, TableContainerProps as MUITableContainerProps} from '@mui/material';

interface AppTableContainerProps extends MUITableContainerProps {
}

export const AppTableContainer: React.FC<AppTableContainerProps> = ({
                                                                        ...props
                                                                    }) => {
    return (
        <MUITableContainer
            {...props}
        />
    );
};