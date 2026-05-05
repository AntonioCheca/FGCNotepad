import React from 'react';
import {TableFooter as MUITableFooter, TableFooterProps as MUITableFooterProps} from '@mui/material';

type AppTableFooterProps = MUITableFooterProps;

export const AppTableFooter: React.FC<AppTableFooterProps> = ({
                                                                  ...props
                                                              }) => {
    return (
        <MUITableFooter
            {...props}
        />
    );
};
