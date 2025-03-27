import React from 'react';
import {TableCell as MUITableCell, TableCellProps as MUITableCellProps} from '@mui/material';

interface AppTableCellProps extends MUITableCellProps {
}

export const AppTableCell: React.FC<AppTableCellProps> = ({
                                                              ...props
                                                          }) => {
    return (
        <MUITableCell
            {...props}
        />
    );
};