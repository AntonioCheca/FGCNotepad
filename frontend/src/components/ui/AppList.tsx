import React from 'react';
import {List as MUIList, ListProps as MUIListProps} from '@mui/material';

type AppListProps = MUIListProps;

export const AppList: React.FC<AppListProps> = ({
                                                    ...props
                                                }) => {
    return (
        <MUIList
            {...props}
        />
    );
};
