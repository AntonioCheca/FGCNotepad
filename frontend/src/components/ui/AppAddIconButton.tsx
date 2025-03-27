import React from 'react';
import AddIcon from "@mui/icons-material/Add";
import {IconButton as MUIIconButton, IconButtonProps as MUIIconButtonProps} from '@mui/material';

interface AppIconButtonProps extends MUIIconButtonProps {
}

export const AppAddIconButton: React.FC<AppIconButtonProps> = ({
                                                                   ...props
                                                               }) => {
    return (
        <MUIIconButton
            {...props}>
            <AddIcon/>
        </MUIIconButton>
    );
};