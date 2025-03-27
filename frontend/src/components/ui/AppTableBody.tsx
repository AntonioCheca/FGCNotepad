import React from 'react';
import {TableBody as MUITableBody, TableBodyProps as MUITableBodyProps} from '@mui/material';

interface AppTableBodyProps extends MUITableBodyProps {
}

export const AppTableBody: React.FC<AppTableBodyProps> = ({
                                                              ...props
                                                          }) => {
    return (
        <MUITableBody
            {...props}
        />
    );
};