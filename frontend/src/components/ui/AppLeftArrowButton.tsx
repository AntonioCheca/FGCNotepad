import React from 'react';
import {IconButton as MUIIconButton, IconButtonProps as MUIIconButtonProps} from '@mui/material';
import {ArrowBack} from "@mui/icons-material";

interface AppIconButtonProps extends MUIIconButtonProps {
}

export const AppLeftArrowButton: React.FC<AppIconButtonProps> = ({
                                                                     ...props
                                                                 }) => {
    return (
        <MUIIconButton
            {...props}>
            <ArrowBack/>
        </MUIIconButton>
    );
};