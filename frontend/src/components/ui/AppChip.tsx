import React from 'react';
import {Chip as MUIChip, ChipProps as MUIChipProps} from '@mui/material';

type AppChipProps = MUIChipProps;

export const AppChip: React.FC<AppChipProps> = ({
                                                    ...props
                                                }) => {
    return (
        <MUIChip
            {...props}
        />
    );
};
