import React from "react";

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
        <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap"}}>
            <AppTypography variant="body2">Personalize Defender</AppTypography>
            <select
                aria-label="Personalized defender"
                value={personalizedDefenderId}
                onChange={(event) => onPersonalizedDefenderIdChange(event.target.value)}
                style={{height: 36, borderRadius: 6, border: `1px solid ${theme.fgc.border.default}`, background: theme.fgc.control.default, color: theme.fgc.text.primary, padding: "0 10px"}}
            >
                <option value="">Generic (All defensive options)</option>
                {characters.map((character) => (
                    <option key={character.id} value={character.id}>{character.name}</option>
                ))}
            </select>
        </div>
    );
}
