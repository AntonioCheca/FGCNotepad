import React from 'react';
import {IconButton as MUIIconButton, IconButtonProps as MUIIconButtonProps} from '@mui/material';
import {ArrowDownward} from "@mui/icons-material";

interface AppIconButtonProps extends MUIIconButtonProps {
}

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