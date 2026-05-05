import React from 'react';
import {TableBody as MUITableBody, TableBodyProps as MUITableBodyProps} from '@mui/material';

type AppTableBodyProps = MUITableBodyProps;

export const AppTableBody: React.FC<AppTableBodyProps> = ({
                                                              ...props
                                                          }) => {
    return (
        <MUITableBody
            {...props}
        />
    );
};
