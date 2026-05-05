import React from 'react';
import {Container as MUIContainer, ContainerProps as MUIContainerProps} from '@mui/material';

type AppContainerProps = MUIContainerProps;

export const AppContainer: React.FC<AppContainerProps> = ({
                                                              ...props
                                                          }) => {
    return (
        <MUIContainer
            {...props}
        />
    );
};
