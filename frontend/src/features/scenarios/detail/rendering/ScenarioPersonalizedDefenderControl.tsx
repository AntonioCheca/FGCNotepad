import React from "react";

import {AppBox} from "@/src/components/ui/AppBox";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppTypography} from "@/src/components/ui/AppTypography";
import type {Theme} from "@/src/components/ui/AppThemeUtils";
import type {CharacterLifeOption} from "../scenarioDetailUtils";

interface ScenarioPersonalizedDefenderControlProps {
    personalizedDefenderId: string;
    characters: CharacterLifeOption[];
    theme: Theme;
    onPersonalizedDefenderIdChange: (value: string) => void;
}

export function ScenarioPersonalizedDefenderControl({personalizedDefenderId, characters, theme, onPersonalizedDefenderIdChange}: ScenarioPersonalizedDefenderControlProps) {
    return (
        <AppBox sx={{display: "flex", alignItems: "center", gap: {xs: 0.75, md: 1}, p: {xs: 1, md: 1.2}, border: "1px solid", borderColor: theme.fgc.border.default, borderRadius: 1.5, backgroundColor: theme.fgc.surface.base, flexWrap: "wrap", minWidth: 0}}>
            <AppTypography variant="body2">Personalize Defender</AppTypography>
            <AppFormControl size="small" sx={{minWidth: {xs: "100%", sm: 280}}}>
                <AppInputLabel id="personalized-defender-label">Defender</AppInputLabel>
                <AppSelect<string>
                    labelId="personalized-defender-label"
                    label="Defender"
                    value={personalizedDefenderId}
                    onChange={(event) => onPersonalizedDefenderIdChange(event.target.value)}
                >
                    <AppMenuItem value="">Generic (All defensive options)</AppMenuItem>
                    {characters.map((character) => (
                        <AppMenuItem key={character.id} value={character.id}>{character.name}</AppMenuItem>
                    ))}
                </AppSelect>
            </AppFormControl>
        </AppBox>
    );
}
