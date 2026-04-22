export type ScenarioExecutionMode = "my_knowledge" | "standard" | "difficulty_cap";

export interface ScenarioExecutionPreference {
    defaultMode: ScenarioExecutionMode;
    difficultyCap: number | null;
}

export interface ScenarioExecutionSelection {
    mode: ScenarioExecutionMode;
    difficultyCap: number | null;
}

export interface ComboKnowledgeCharacter {
    id: string;
    name: string;
}

export interface ComboKnowledgeItem {
    id: number;
    name: string;
    difficultyLevel: number | null;
    damage: number | null;
    known: boolean;
}

export interface ComboKnowledgeResponse {
    characters: ComboKnowledgeCharacter[];
    selectedCharacterId: string | null;
    combos: ComboKnowledgeItem[];
}
