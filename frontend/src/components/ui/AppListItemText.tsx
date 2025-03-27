import React from 'react';
import {ListItemText as MUIListItemText, ListItemTextProps as MUIListItemTextProps} from '@mui/material';

interface AppListItemTextProps extends MUIListItemTextProps {
}

export const AppListItemText: React.FC<AppListItemTextProps> = ({
                                                                    ...props
                                                                }) => {
    return (
        <MUIListItemText
            {...props}
        />
    );
};