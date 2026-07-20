import React from "react";

import type {ScenarioDetail, ScenarioResourceContextPayload} from "@/hooks/useScenarios";
import {DEFAULT_CHARACTER_LIFE, DEFAULT_SCENARIO_RESOURCES, type CharacterLifeOption, resolveScenarioCharacterLife} from "../scenarioDetailUtils";

interface UseScenarioResourceStateOptions {
    scenarioId: string | null;
    scenario: ScenarioDetail | null;
    characters: CharacterLifeOption[];
}

export function useScenarioResourceState({scenarioId, scenario, characters}: UseScenarioResourceStateOptions) {
    const [scenarioResources, setScenarioResources] = React.useState<ScenarioResourceContextPayload>(DEFAULT_SCENARIO_RESOURCES);

    const characterById = React.useMemo(() => {
        const map = new Map<string, CharacterLifeOption>();
        characters.forEach((character) => {
            map.set(character.id, character);
        });
        return map;
    }, [characters]);

    const characterByName = React.useMemo(() => {
        const map = new Map<string, CharacterLifeOption>();
        characters.forEach((character) => {
            map.set(character.name.trim().toLowerCase(), character);
        });
        return map;
    }, [characters]);

    const attackerLifeMax = React.useMemo(() => {
        return resolveScenarioCharacterLife(
            scenario,
            scenario?.attackerCharacterId,
            scenario?.attackerCharacterName,
            scenario?.attackerCharacterLife,
            characterById,
            characterByName,
        );
    }, [characterById, characterByName, scenario]);

    const defenderLifeMax = React.useMemo(() => {
        return resolveScenarioCharacterLife(
            scenario,
            scenario?.defenderCharacterId,
            scenario?.defenderCharacterName,
            scenario?.defenderCharacterLife,
            characterById,
            characterByName,
        );
    }, [characterById, characterByName, scenario]);

    React.useEffect(() => {
        setScenarioResources((current) => ({
            attacker: {
                ...current.attacker,
                health: attackerLifeMax || DEFAULT_CHARACTER_LIFE,
            },
            defender: {
                ...current.defender,
                health: defenderLifeMax || DEFAULT_CHARACTER_LIFE,
            },
        }));
    }, [scenarioId, attackerLifeMax, defenderLifeMax]);

    return {scenarioResources, setScenarioResources, attackerLifeMax, defenderLifeMax};
}
