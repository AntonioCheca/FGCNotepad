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
    delay_type?: "fixed" | "window";
    delay_frames?: string;
    delay_min_frames?: string;
    delay_max_frames?: string;
}

export interface CreateFullComboPayload {
    name: string;
    description?: string;
    metrics?: { damage?: number };
    requirements?: ComboRequirementsPayload;
    steps: Array<{
        child_sequence_id: ID;
        ordinal_in_combo: number;
        connection_type_id: ID | null;
        delay_frames?: number;
        delay_min_frames?: number;
        delay_max_frames?: number;
    }>; 
}

export interface RequirementSpecificCharacterPayload {
    object_name: string;
    status_required: string | number | boolean;
}

export interface RequirementObjectOption {
    name: string;
    status_type: "integer" | "boolean";
    max_status: number | null;
}

export interface ComboRequirementsPayload {
    counter_hit_required?: boolean;
    punish_counter_required?: boolean;
    corner_required?: boolean;
    airborne_required?: boolean;
    mid_screen_required?: boolean;
    not_crouching_required?: boolean;
    requirement_specific_character?: RequirementSpecificCharacterPayload;
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
    delay_min_frames?: number | null;
    delay_max_frames?: number | null;
    token: string;
}

export function isDelayConnection(connection: ConnectionType | null): boolean {
    if (!connection?.name) {
        return false;
    }

    const normalized = connection.name.toLowerCase().replace(/[^a-z0-9]/g, "");

    return normalized === "delay";
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

interface ComboMoveSummary {
    name?: string;
}

interface ComboSeasonSummary {
    name?: string;
}

interface ComboApiSummary {
    id: number;
    name?: string;
    character?: { name?: string };
    moves?: ComboMoveSummary[];
    comboMetrics?: { damage?: number | string };
    season?: ComboSeasonSummary[];
}

// utils/combos.ts
export function mapComboToRow(combo: ComboApiSummary): ComboRow {
    return {
        id: combo.id,
        title: combo.name ?? "-",
        characterName: combo.character?.name ?? "-",
        moves: combo.moves?.map((move) => move.name ?? "-") ?? [],
        damage: combo.comboMetrics?.damage ?? "-",
        season: Array.isArray(combo.season)
            ? combo.season.map((season) => season.name ?? "-").join(", ")
            : "-"
    };
}

