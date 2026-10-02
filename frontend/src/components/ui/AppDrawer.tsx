import React from 'react';
import {Drawer as MUIDrawer, DrawerProps as MUIDrawerProps} from '@mui/material';

export type AppDrawerProps = MUIDrawerProps;

export const AppDrawer: React.FC<AppDrawerProps> = (props) => {
    return <MUIDrawer {...props} />;
};
