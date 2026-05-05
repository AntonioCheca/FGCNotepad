import React from 'react';
import {ListItemText as MUIListItemText, ListItemTextProps as MUIListItemTextProps} from '@mui/material';

type AppListItemTextProps = MUIListItemTextProps;

export const AppListItemText: React.FC<AppListItemTextProps> = ({
                                                                    ...props
                                                                }) => {
    return (
        <MUIListItemText
            {...props}
        />
    );
};
