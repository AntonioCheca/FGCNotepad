import type {ScenarioType} from "@/hooks/useScenarios";

export interface ScenarioTriggerMoveOption {
    id: string;
    summary: string;
}

export interface ScenarioCharacterOption {
    id: string;
    name: string;
}

export interface ScenarioSearchDraft {
    q?: string;
    scenarioType?: ScenarioType | "";
    defenderCharacterId?: string;
    attackerCharacterId?: string;
    triggerMoveId?: string;
}

export interface ScenarioTypeOption {
    label: string;
    value: ScenarioType;
}

export interface ScenarioSearchFilterState {
    query: string;
    scenarioType: ScenarioType | "";
    defenderCharacterId: string;
    attackerCharacterId: string;
    triggerMoveSelection: ScenarioTriggerMoveOption | null;
    triggerMoveInput: string;
    showAdvancedFilters: boolean;
}
