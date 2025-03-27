import React from 'react';
import {Container as MUIContainer, ContainerProps as MUIContainerProps} from '@mui/material';

interface AppContainerProps extends MUIContainerProps {
}

export const AppContainer: React.FC<AppContainerProps> = ({
                                                              ...props
                                                          }) => {
    return (
        <MUIContainer
            {...props}
        />
    );
};