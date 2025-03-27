import React from 'react';
import {IconButton as MUIIconButton, IconButtonProps as MUIIconButtonProps} from '@mui/material';
import {ArrowForward} from "@mui/icons-material";

interface AppIconButtonProps extends MUIIconButtonProps {
}

export const AppRightArrowButton: React.FC<AppIconButtonProps> = ({
                                                                      ...props
                                                                  }) => {
    return (
        <MUIIconButton
            {...props}>
            <ArrowForward/>
        </MUIIconButton>
    );
};