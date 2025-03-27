import React from 'react';
import {Card as MUICard, CardProps as MUICardProps} from '@mui/material';

interface AppCardProps extends MUICardProps {
}

export const AppCard: React.FC<AppCardProps> = ({
                                                    ...props
                                                }) => {
    return (
        <MUICard
            {...props}
        />
    );
};