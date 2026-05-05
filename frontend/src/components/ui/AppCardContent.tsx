import React from 'react';
import {CardContent as MUICardContent, CardContentProps as MUICardContentProps} from '@mui/material';

type AppCardContentProps = MUICardContentProps;

export const AppCardContent: React.FC<AppCardContentProps> = ({
                                                                  ...props
                                                              }) => {
    return (
        <MUICardContent
            {...props}
        />
    );
};
