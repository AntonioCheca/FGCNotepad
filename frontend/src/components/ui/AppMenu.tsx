import React from 'react';
import {Menu as MUIMenu, MenuProps as MUIMenuProps} from '@mui/material';

export type AppMenuProps = MUIMenuProps;

export const AppMenu: React.FC<AppMenuProps> = (props) => {
    return <MUIMenu {...props} />;
};
