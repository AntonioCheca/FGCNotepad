import React from "react";
import {Slider as MUISlider, SliderProps as MUISliderProps} from "@mui/material";

type AppSliderProps = MUISliderProps;

export const AppSlider: React.FC<AppSliderProps> = (props) => {
    return <MUISlider {...props} />;
};
