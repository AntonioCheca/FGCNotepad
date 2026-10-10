import type {ComboExecutionMode} from "@/src/types/comboExecution";
import type {ModerationState} from "@/src/types/moderation";
import {ComboSpacingOption, RequirementSpecificCharacterPayload} from "@/src/types/comboDraft";
import {ComboSeasonSummary, comboDisplayTitle, wholeDamage} from "@/src/types/comboSummary";

export interface ComboRequirement {
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
    executionMode?: ComboExecutionMode;
    executionNotation?: string | null;
    modernLegal?: boolean;
    moderationState?: ModerationState;
    inputNotation?: string | null;
    character?: { id?: string | number; name?: string } | null;
    comboMetrics?: ComboMetricsApi | null;
    comboRequirement?: ComboRequirement | null;
    spacing?: ComboSpacingOption | null;
    season?: ComboSeasonSummary[];
    steps?: ComboStep[];
    needs_technical_review?: boolean;
}

export interface ComboDetailView {
    id: number;
    title: string;
    displayTitle: string;
    executionMode: ComboExecutionMode;
    modernLegal: boolean;
    moderationState: ModerationState;
    inputNotation: string;
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
    spacing: ComboSpacingOption | null;
    needsTechnicalReview: boolean;
    requirements: ComboRequirement | null;
    steps: ComboStep[];
}

export function mapComboToDetailView(combo: ComboDetailApi): ComboDetailView {
    return {
        id: combo.id,
        title: combo.name ?? "-",
        displayTitle: comboDisplayTitle(combo),
        executionMode: combo.executionMode ?? "classic",
        modernLegal: combo.modernLegal ?? false,
        moderationState: combo.moderationState ?? "approved",
        inputNotation: combo.inputNotation ?? "",
        characterId: combo.character?.id !== undefined ? String(combo.character.id) : null,
        characterName: combo.character?.name ?? "-",
        damage: combo.comboMetrics?.damage ?? "-",
        resourceAdjustedDamage: wholeDamage(combo.comboMetrics?.resourceAdjustedDamage ?? combo.comboMetrics?.damage ?? "-"),
        driveCost: combo.comboMetrics?.driveCost ?? "-",
        minimumDriveCost: combo.comboMetrics?.minimumDriveCost ?? "-",
        minimumDriveCostNoBurnout: combo.comboMetrics?.minimumDriveCostNoBurnout ?? "-",
        driveGain: combo.comboMetrics?.driveGain ?? "-",
        superCost: combo.comboMetrics?.superCost ?? "-",
        superGain: combo.comboMetrics?.superGain ?? "-",
        seasonLabels: Array.isArray(combo.season)
            ? combo.season.map((season) => season.name ?? "-")
            : [],
        spacing: combo.spacing ?? null,
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
