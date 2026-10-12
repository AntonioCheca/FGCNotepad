import React from 'react';
import {Button as MUIButton, ButtonProps as MUIButtonProps} from '@mui/material';

// target/rel reach the rendered <a> when the button has an href.
type AppButtonProps = MUIButtonProps & Pick<React.AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel">;

export const AppButton: React.FC<AppButtonProps> = ({
                                                        type = "submit",
                                                        variant = "contained",
                                                        color = "primary",
                                                        ...props
                                                    }) => {

    return (
        <MUIButton
            type={type}
            variant={variant}
            color={color}
            {...props}
        />
    );
};
