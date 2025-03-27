import React from 'react';
import {Paper as MUIPaper, PaperProps as MUIPaperProps} from '@mui/material';

interface AppPaperProps extends MUIPaperProps {
}

export const AppPaper: React.FC<AppPaperProps> = ({
                                                      ...props
                                                  }) => {
    return (
        <MUIPaper
            {...props}
        />
    );
};