import React from 'react';
import {ListItem as MUIListItem, ListItemProps as MUIListItemProps} from '@mui/material';

interface AppListItemProps extends MUIListItemProps {
}

export const AppListItem: React.FC<AppListItemProps> = ({
                                                            ...props
                                                        }) => {
    return (
        <MUIListItem
            {...props}
        />
    );
};