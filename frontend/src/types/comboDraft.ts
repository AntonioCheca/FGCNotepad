import type {ComboExecutionMode} from "@/src/types/comboExecution";

export type ID = number;

export interface ConnectionType {
    id: ID;
    name: string;
}

export interface ComboSpacingOption {
    id: ID;
    code: string;
    name: string;
    description: string;
    sortOrder: number;
}

export interface CharacterOption {
    id: string;
    name: string;
}

export interface LeafSequenceOption {
    id: ID;
    name: string;
    character: CharacterOption;
}

export interface StepDraft {
    move: LeafSequenceOption | null;
    connection: ConnectionType | null;
    delay_type?: "fixed" | "window";
    delay_frames?: string;
    delay_min_frames?: string;
    delay_max_frames?: string;
    delay_min_unverified?: boolean;
    delay_max_unverified?: boolean;
}

export interface CreateFullComboPayload {
    name: string;
    inputNotation?: string | null;
    spacingCode?: string | null;
    metrics?: {
        damage?: number;
        driveCost?: number;
        driveGain?: number;
        minimumDriveCost?: number;
        minimumDriveCostNoBurnout?: number;
        superCost?: number;
        superGain?: number;
        damageExecutionMode?: ComboExecutionMode;
    };
    requirements?: ComboRequirementsPayload;
    steps: Array<{
        child_sequence_id: ID;
        ordinal_in_combo: number;
        connection_type_id: ID | null;
        delay_frames?: number;
        delay_min_frames?: number;
        delay_max_frames?: number;
        delay_min_unverified?: boolean;
        delay_max_unverified?: boolean;
    }>; 
}

export interface RequirementSpecificCharacterPayload {
    object_key?: string | null;
    character_name?: string | null;
    object_name?: string;
    status_required?: string | number | boolean | null;
    consumed?: boolean;
    added_relative?: string | number | boolean | null;
    added_absolute?: string | number | boolean | null;
    kind?: CharacterObjectKind | null;
}

export type CharacterObjectKind = "stock" | "scaler" | "state";

export interface RequirementObjectOption {
    object_key: string;
    name: string;
    character_name: string;
    display_name: string;
    kind?: CharacterObjectKind;
    status_type: "integer" | "boolean";
    max_status: number | null;
    can_be_consumed: boolean;
    can_be_added_relative: boolean;
    can_be_added_absolute: boolean;
}

export interface ComboObjectStateDraft {
    object_key: string;
    status_required: string;
    consumed: boolean;
    added_relative: string;
    added_absolute: string;
}

export interface ComboRequirementsPayload {
    counter_hit_required?: boolean;
    punish_counter_required?: boolean;
    perfect_parry_required?: boolean;
    blocked_drive_impact_stun_required?: boolean;
    corner_required?: boolean;
    airborne_required?: boolean;
    not_crouching_required?: boolean;
    side_switches_required?: boolean;
    initial_opponent_posture?: string | null;
    initial_opponent_ground_state?: string | null;
    initial_juggle_altitude?: string | null;
    requirement_specific_character?: RequirementSpecificCharacterPayload;
    combo_object_states?: RequirementSpecificCharacterPayload[];
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
    delay_min_unverified?: boolean;
    delay_max_unverified?: boolean;
    token: string;
}

export function isDelayConnection(connection: ConnectionType | null): boolean {
    if (!connection?.name) {
        return false;
    }

    const normalized = connection.name.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Delay and the walk connections are timed: they carry a frame window.
    return normalized === "delay" || normalized === "walkforward" || normalized === "walkback";
}

export interface TranslateComboNotationResponse {
    steps: TranslatedStep[];
    parsedTokens: TranslateParsedToken[];
    warnings: string[];
    errors: TranslateErrorToken[];
    requirements?: Pick<ComboRequirementsPayload, "counter_hit_required" | "punish_counter_required" | "perfect_parry_required" | "blocked_drive_impact_stun_required" | "not_crouching_required">;
}

export interface EstimateComboDamageResponse extends TranslateComboNotationResponse {
    estimatedDamage: number;
    stepDamages: number[];
    input?: {
        rawNotation?: string;
        canonicalNotation?: string;
        tokenMap?: Array<{ raw?: string; canonical?: string }>;
    };
}

export interface EstimateComboResourcesResponse extends TranslateComboNotationResponse {
    driveUsed: number;
    driveGain: number;
    minimumDriveCost: number | null;
    minimumDriveCostNoBurnout: number | null;
    superUsed: number;
    superGain: number;
    totalFrames: number;
    input?: {
        rawNotation?: string;
        canonicalNotation?: string;
        tokenMap?: Array<{ raw?: string; canonical?: string }>;
    };
}
