import React from "react";
import {Avatar as MUIAvatar, AvatarProps as MUIAvatarProps} from "@mui/material";

interface AppAvatarProps extends MUIAvatarProps {}

export const AppAvatar: React.FC<AppAvatarProps> = ({...props}) => {
    return <MUIAvatar {...props} />;
};
