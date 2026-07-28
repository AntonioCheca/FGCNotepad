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
    description?: string;
    metrics?: {
        damage?: number;
        driveCost?: number;
        driveGain?: number;
        minimumDriveCost?: number;
        minimumDriveCostNoBurnout?: number;
        superCost?: number;
        superGain?: number;
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
}

export interface RequirementObjectOption {
    object_key: string;
    name: string;
    character_name: string;
    display_name: string;
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
    corner_required?: boolean;
    airborne_required?: boolean;
    not_crouching_required?: boolean;
    side_switches_required?: boolean;
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

    return normalized === "delay";
}

export interface TranslateComboNotationResponse {
    steps: TranslatedStep[];
    parsedTokens: TranslateParsedToken[];
    warnings: string[];
    errors: TranslateErrorToken[];
    requirements?: Pick<ComboRequirementsPayload, "counter_hit_required" | "punish_counter_required" | "not_crouching_required">;
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

export interface ComboRow {
    id: number;
    title: string;
    moderationState: string;
    characterName: string;
    moves: string[];
    starter: string;
    ender: string;
    damage: number | string;
    resourceAdjustedDamage: number | string;
    driveCost: number | string;
    minimumDriveCost: number | string;
    minimumDriveCostNoBurnout: number | string;
    driveGain: number | string;
    superCost: number | string;
    superGain: number | string;
    season: string;
    isUsable: boolean;
    isFullyAudited: boolean;
    needsTechnicalReview: boolean;
}

interface ComboMoveSummary {
    name?: string;
}

interface ComboStepSummary {
    child_sequence_name?: string | null;
}

interface ComboSeasonSummary {
    name?: string;
}

export interface ComboApiSummary {
    id: number;
    name?: string;
    moderationState?: string;
    character?: { name?: string };
    moves?: ComboMoveSummary[];
    steps?: ComboStepSummary[];
    comboMetrics?: ComboMetricsApi;
    season?: ComboSeasonSummary[];
    is_usable?: boolean;
    is_fully_audited?: boolean;
    needs_technical_review?: boolean;
}

export function mapComboToRow(combo: ComboApiSummary): ComboRow {
    const moveNamesFromLegacyField = combo.moves?.map((move) => move.name ?? "-") ?? [];
    const moveNamesFromSteps: string[] = [];
    for (const step of combo.steps ?? []) {
        const name = step.child_sequence_name ?? "";
        if (name.trim() !== "") {
            moveNamesFromSteps.push(name);
        }
    }

    const moves = moveNamesFromLegacyField.length > 0 ? moveNamesFromLegacyField : moveNamesFromSteps;

    return {
        id: combo.id,
        title: combo.name ?? "-",
        moderationState: combo.moderationState ?? "approved",
        characterName: combo.character?.name ?? "-",
        moves,
        starter: moves[0] ?? "-",
        ender: moves.length > 0 ? moves[moves.length - 1] : "-",
        damage: combo.comboMetrics?.damage ?? "-",
        resourceAdjustedDamage: combo.comboMetrics?.resourceAdjustedDamage ?? combo.comboMetrics?.damage ?? "-",
        driveCost: combo.comboMetrics?.driveCost ?? "-",
        minimumDriveCost: combo.comboMetrics?.minimumDriveCost ?? "-",
        minimumDriveCostNoBurnout: combo.comboMetrics?.minimumDriveCostNoBurnout ?? "-",
        driveGain: combo.comboMetrics?.driveGain ?? "-",
        superCost: combo.comboMetrics?.superCost ?? "-",
        superGain: combo.comboMetrics?.superGain ?? "-",
        season: Array.isArray(combo.season)
            ? combo.season.map((season) => season.name ?? "-").join(", ")
            : "-",
        isUsable: combo.is_usable ?? true,
        isFullyAudited: combo.is_fully_audited ?? true,
        needsTechnicalReview: combo.needs_technical_review ?? false,
    };
}

export interface ComboRequirement {
    counter_hit_required?: boolean;
    punish_counter_required?: boolean;
    corner_required?: boolean;
    airborne_required?: boolean;
    not_crouching_required?: boolean;
    side_switches_required?: boolean;
    requirement_specific_character?: {
        object_key?: string | null;
        character_name?: string | null;
        object_name?: string;
        status_required?: string | number | boolean | null;
        consumed?: boolean;
        added_relative?: string | number | boolean | null;
        added_absolute?: string | number | boolean | null;
    } | null;
    combo_object_states?: RequirementSpecificCharacterPayload[];
}

export interface ComboStep {
    id: number;
    child_sequence_id: number | null;
    child_sequence_name: string | null;
    child_sequence_notation?: string | null;
    ordinal_in_combo: number;
    connection_type_id: number | null;
    connection_type_name: string | null;
    delay_min_frames: number | null;
    delay_max_frames: number | null;
    delay_min_unverified: boolean;
    delay_max_unverified: boolean;
}

export interface ComboDetailApi {
    id: number;
    name?: string;
    description?: string | null;
    character?: { id?: string | number; name?: string } | null;
    comboMetrics?: ComboMetricsApi | null;
    comboRequirement?: ComboRequirement | null;
    season?: ComboSeasonSummary[];
    steps?: ComboStep[];
    needs_technical_review?: boolean;
}

export interface ComboDetailView {
    id: number;
    title: string;
    description: string;
    characterId: string | null;
    characterName: string;
    damage: number | string;
    resourceAdjustedDamage: number | string;
    driveCost: number | string;
    minimumDriveCost: number | string;
    minimumDriveCostNoBurnout: number | string;
    driveGain: number | string;
    superCost: number | string;
    superGain: number | string;
    seasonLabels: string[];
    needsTechnicalReview: boolean;
    requirements: ComboRequirement | null;
    steps: ComboStep[];
}

export function mapComboToDetailView(combo: ComboDetailApi): ComboDetailView {
    return {
        id: combo.id,
        title: combo.name ?? "-",
        description: combo.description ?? "",
        characterId: combo.character?.id !== undefined ? String(combo.character.id) : null,
        characterName: combo.character?.name ?? "-",
        damage: combo.comboMetrics?.damage ?? "-",
        resourceAdjustedDamage: combo.comboMetrics?.resourceAdjustedDamage ?? combo.comboMetrics?.damage ?? "-",
        driveCost: combo.comboMetrics?.driveCost ?? "-",
        minimumDriveCost: combo.comboMetrics?.minimumDriveCost ?? "-",
        minimumDriveCostNoBurnout: combo.comboMetrics?.minimumDriveCostNoBurnout ?? "-",
        driveGain: combo.comboMetrics?.driveGain ?? "-",
        superCost: combo.comboMetrics?.superCost ?? "-",
        superGain: combo.comboMetrics?.superGain ?? "-",
        seasonLabels: Array.isArray(combo.season)
            ? combo.season.map((season) => season.name ?? "-")
            : [],
        needsTechnicalReview: combo.needs_technical_review ?? false,
        requirements: combo.comboRequirement ?? null,
        steps: Array.isArray(combo.steps)
            ? [...combo.steps].sort((left, right) => left.ordinal_in_combo - right.ordinal_in_combo)
            : [],
    };
}

export interface ComboMetricsApi {
    damage?: number | string;
    difficultyLevel?: number | string | null;
    driveCost?: number | string | null;
    minimumDriveCost?: number | string | null;
    minimumDriveCostNoBurnout?: number | string | null;
    driveGain?: number | string | null;
    superCost?: number | string | null;
    superGain?: number | string | null;
    resourceAdjustedDamage?: number | string | null;
}

