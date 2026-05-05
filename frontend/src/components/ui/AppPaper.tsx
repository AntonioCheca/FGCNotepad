import React from 'react';
import {Paper as MUIPaper, PaperProps as MUIPaperProps} from '@mui/material';

type AppPaperProps = MUIPaperProps;

export const AppPaper: React.FC<AppPaperProps> = ({
                                                      ...props
                                                  }) => {
    return (
        <MUIPaper
            {...props}
        />
    );
};
