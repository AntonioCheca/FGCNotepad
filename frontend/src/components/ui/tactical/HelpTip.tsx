import {AppBox} from "@/src/components/ui/AppBox";
import {AppTooltip} from "@/src/components/ui/AppTooltip";
import {HelpOutlineOutlinedIcon} from "@/src/components/ui/AppIcons";

interface HelpTipProps {
    text: string;
}

// Help icon whose tooltip opens on hover, keyboard focus, or a single tap on touch screens.
export function HelpTip({text}: HelpTipProps) {
    return (
        <AppTooltip title={text} enterTouchDelay={0} leaveTouchDelay={5000}>
            <AppBox
                component="span"
                role="button"
                tabIndex={0}
                sx={{display: "inline-flex", p: 0.5, m: -0.5, borderRadius: "50%", cursor: "help"}}
            >
                <HelpOutlineOutlinedIcon fontSize="small"/>
            </AppBox>
        </AppTooltip>
    );
}
