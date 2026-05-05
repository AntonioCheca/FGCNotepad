import React from 'react';
import {MenuItem as MUIMenuItem, MenuItemProps as MUIMenuItemProps} from '@mui/material';

export type AppMenuItemProps = MUIMenuItemProps;

export const AppMenuItem: React.FC<AppMenuItemProps> = (props) => {
    return <MUIMenuItem {...props} />;
};
