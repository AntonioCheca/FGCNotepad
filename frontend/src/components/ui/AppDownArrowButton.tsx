import React from 'react';
import {IconButton as MUIIconButton, IconButtonProps as MUIIconButtonProps} from '@mui/material';
import {ArrowDownward} from "@mui/icons-material";

type AppIconButtonProps = MUIIconButtonProps;

export const AppDownArrowButton: React.FC<AppIconButtonProps> = ({
                                                                     ...props
                                                                 }) => {
    return (
        <MUIIconButton
            {...props}>
            <ArrowDownward/>
        </MUIIconButton>
    );
};
