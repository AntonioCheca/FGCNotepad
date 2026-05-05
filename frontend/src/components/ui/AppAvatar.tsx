import React from "react";
import {Avatar as MUIAvatar, AvatarProps as MUIAvatarProps} from "@mui/material";

type AppAvatarProps = MUIAvatarProps;

export const AppAvatar: React.FC<AppAvatarProps> = ({...props}) => {
    return <MUIAvatar {...props} />;
};
