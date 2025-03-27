import React from 'react';
import {TableHead as MUITableHead, TableHeadProps as MUITableHeadProps} from '@mui/material';

interface AppTableHeadProps extends MUITableHeadProps {
}

export const AppTableHead: React.FC<AppTableHeadProps> = ({
                                                              ...props
                                                          }) => {
    return (
        <MUITableHead
            {...props}
        />
    );
};