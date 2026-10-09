import {AppBox} from "@/src/components/ui/AppBox";
import type {ComboCondition} from "./comboConditions";

interface ComboConditionTextProps {
    conditions: ComboCondition[];
    sx?: object;
}

export function ComboConditionText({conditions, sx}: ComboConditionTextProps) {
    if (conditions.length === 0) {
        return null;
    }

    return (
        <AppBox component="span" sx={{display: "inline-flex", flexWrap: "wrap", columnGap: 1, rowGap: 0.25, ...sx}}>
            {conditions.map((condition) => (
                <AppBox key={condition.id} component="abbr" title={condition.label} sx={{textDecoration: "none", cursor: "inherit"}}>
                    {condition.text}
                </AppBox>
            ))}
        </AppBox>
    );
}
