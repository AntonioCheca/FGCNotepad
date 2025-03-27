import React from 'react';
import {Chip as MUIChip, ChipProps as MUIChipProps} from '@mui/material';

interface AppChipProps extends MUIChipProps {
}

export const AppChip: React.FC<AppChipProps> = ({
                                                    ...props
                                                }) => {
    return (
        <MUIChip
            {...props}
        />
    );
};