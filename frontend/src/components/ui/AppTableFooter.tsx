import React from 'react';
import {TableFooter as MUITableFooter, TableFooterProps as MUITableFooterProps} from '@mui/material';

interface AppTableFooterProps extends MUITableFooterProps {
}

export const AppTableFooter: React.FC<AppTableFooterProps> = ({
                                                                  ...props
                                                              }) => {
    return (
        <MUITableFooter
            {...props}
        />
    );
};