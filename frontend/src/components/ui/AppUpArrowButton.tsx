import React from 'react';
import {IconButton as MUIIconButton, IconButtonProps as MUIIconButtonProps} from '@mui/material';
import {ArrowUpward} from "@mui/icons-material";

type AppIconButtonProps = MUIIconButtonProps;

export const AppUpArrowButton: React.FC<AppIconButtonProps> = ({
                                                                   ...props
                                                               }) => {
    return (
        <MUIIconButton
            {...props}>
            <ArrowUpward/>
        </MUIIconButton>
    );
};
