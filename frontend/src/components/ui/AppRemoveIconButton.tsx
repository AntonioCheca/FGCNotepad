import React from 'react';
import RemoveIcon from "@mui/icons-material/Remove";
import {IconButton as MUIIconButton, IconButtonProps as MUIIconButtonProps} from '@mui/material';

type AppIconButtonProps = MUIIconButtonProps;

export const AppRemoveIconButton: React.FC<AppIconButtonProps> = ({
                                                                      ...props
                                                                  }) => {
    return (
        <MUIIconButton
            {...props}>
            <RemoveIcon/>
        </MUIIconButton>
    );
};
