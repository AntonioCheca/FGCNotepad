import React from 'react';
import {List as MUIList, ListProps as MUIListProps} from '@mui/material';

interface AppListProps extends MUIListProps {
}

export const AppList: React.FC<AppListProps> = ({
                                                    ...props
                                                }) => {
    return (
        <MUIList
            {...props}
        />
    );
};