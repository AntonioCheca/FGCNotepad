export type ID = number;

export interface ConnectionType {
    id: ID;
    name: string;
}

export interface CharacterOption {
    id: string;
    name: string;
}

export interface LeafSequenceOption {
    id: ID;                  // ComboSequence ID for a LEAF/Move wrapper
    name: string;
    character: CharacterOption; // ✅ add character for filtering
}

export interface StepDraft {
    move: LeafSequenceOption | null;
    connection: ConnectionType | null;
}

export interface CreateFullComboPayload {
    name: string;
    description?: string;
    metrics?: { damage?: number };
    steps: Array<{
        child_sequence_id: ID;
        ordinal_in_combo: number;
        connection_type_id: ID | null;
    }>; 
}

export interface TranslateComboNotationPayload {
    characterId: string;
    notation: string;
}

export interface TranslateParsedToken {
    index: number;
    token: string;
    normalizedToken: string;
    status: string;
    child_sequence_id: number | null;
    reason: string | null;
}

export interface TranslateErrorToken {
    index: number;
    token: string;
    normalizedToken: string;
    code: string;
    message: string;
}

export interface TranslatedStep {
    child_sequence_id: number;
    ordinal_in_combo: number;
    connection_type_id: number | null;
    connection_type_name: string | null;
    token: string;
}

export interface TranslateComboNotationResponse {
    steps: TranslatedStep[];
    parsedTokens: TranslateParsedToken[];
    warnings: string[];
    errors: TranslateErrorToken[];
}

// types/combo.ts
export interface ComboRow {
    id: number;
    title: string;
    characterName: string;
    moves: string[];        // just move names
    damage: number | string;
    season: string;         // human-readable
}

// utils/combos.ts
export function mapComboToRow(combo: any): ComboRow {
    return {
        id: combo.id,
        title: combo.name ?? "-",
        characterName: combo.character?.name ?? "-",
        moves: combo.moves?.map((m: any) => m.name) ?? [],
        damage: combo.comboMetrics?.damage ?? "-",
        season: Array.isArray(combo.season)
            ? combo.season.map((s: any) => s.name).join(", ")
            : "-"
    };
}

