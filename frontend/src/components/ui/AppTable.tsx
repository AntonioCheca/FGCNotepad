import React from 'react';
import {Table as MUITable, TableProps as MUITableProps} from '@mui/material';

type AppTableProps = MUITableProps;

export const AppTable: React.FC<AppTableProps> = ({
                                                      ...props
                                                  }) => {
    return (
        <MUITable
            {...props}
        />
    );
};
