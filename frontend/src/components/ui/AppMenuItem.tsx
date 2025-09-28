import React from 'react';
import {MenuItem as MUIMenuItem, MenuItemProps as MUIMenuItemProps} from '@mui/material';

export interface AppMenuItemProps extends MUIMenuItemProps {
}

export const AppMenuItem: React.FC<AppMenuItemProps> = (props) => {
    return <MUIMenuItem {...props} />;
};
