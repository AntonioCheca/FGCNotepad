import React from 'react';
import {TableRow as MUITableRow, TableRowProps as MUITableRowProps} from '@mui/material';

type AppTableRowProps = MUITableRowProps;

export const AppTableRow: React.FC<AppTableRowProps> = ({
                                                            ...props
                                                        }) => {
    return (
        <MUITableRow
            {...props}
        />
    );
};
