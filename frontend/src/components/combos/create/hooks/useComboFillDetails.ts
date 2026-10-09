import {useCallback} from "react";
import useCombos from "@/hooks/useCombos";
import type {ComboExecutionMode} from "@/src/types/comboExecution";
import type {
    ComboRequirementsPayload,
    ConnectionType,
    EstimateComboDamageResponse,
    EstimateComboResourcesResponse,
    LeafSequenceOption,
    StepDraft,
    TranslateComboNotationResponse,
    TranslateErrorToken,
    TranslateParsedToken,
} from "@/src/types/combo";
import {type FormNotice, toParsedTokens, toTranslatedSteps} from "@/src/components/combos/create/utils/comboForm";

export type ComboResourceField = "driveCost" | "driveGain" | "minimumDriveCost" | "minimumDriveCostNoBurnout" | "superCost" | "superGain";
export type ComboResourceValues = Partial<Record<ComboResourceField, string>>;

export interface ComboFillDetailsInput {
    characterId: string;
    notation: string;
    leafs: LeafSequenceOption[];
    connections: ConnectionType[];
    requirements: ComboRequirementsPayload;
}

export interface ComboFillDetailsResult {
    steps: StepDraft[];
    parsedTokens: TranslateParsedToken[];
    warnings: string[];
    errors: TranslateErrorToken[];
    requirements: ComboRequirementsPayload;
    defaultTitle: string;
    damage: string | null;
    resources: ComboResourceValues;
    // Null when everything parsed and estimated cleanly.
    notice: FormNotice | null;
}

export function fillDetailsBlocker(input: {characterId: string; notation: string; leafs: LeafSequenceOption[]}): string | null {
    if (!input.characterId.trim()) {
        return "Select a character before filling details.";
    }
    if (!input.notation.trim()) {
        return "Enter notation before filling details.";
    }
    if (input.leafs.length === 0) {
        return "No leaf moves are loaded for the selected character.";
    }

    return null;
}

// Missing minimum drive values clear the field; other missing values leave what the user already has.
export function toResourceValues(resources: EstimateComboResourcesResponse): ComboResourceValues {
    const values: ComboResourceValues = {
        minimumDriveCost: Number.isFinite(resources.minimumDriveCost) ? String(resources.minimumDriveCost) : "",
        minimumDriveCostNoBurnout: Number.isFinite(resources.minimumDriveCostNoBurnout) ? String(resources.minimumDriveCostNoBurnout) : "",
    };
    if (Number.isFinite(resources.driveUsed)) {
        values.driveCost = String(resources.driveUsed);
    }
    if (Number.isFinite(resources.driveGain)) {
        values.driveGain = String(resources.driveGain);
    }
    if (Number.isFinite(resources.superUsed)) {
        values.superCost = String(resources.superUsed);
    }
    if (Number.isFinite(resources.superGain)) {
        values.superGain = String(resources.superGain);
    }

    return values;
}

// Starter conditions come from the notation (PC/CH/PP markers, forced standing); position conditions stay as set.
function mergeTranslatedRequirements(requirements: ComboRequirementsPayload, translated: TranslateComboNotationResponse): ComboRequirementsPayload {
    if (!translated.requirements) {
        return requirements;
    }

    const perfectParry = Boolean(translated.requirements.perfect_parry_required || requirements.perfect_parry_required);
    return {
        ...requirements,
        punish_counter_required: Boolean(translated.requirements.punish_counter_required) || perfectParry,
        counter_hit_required: Boolean(translated.requirements.counter_hit_required) && !perfectParry,
        perfect_parry_required: perfectParry,
        blocked_drive_impact_stun_required: Boolean(translated.requirements.blocked_drive_impact_stun_required || requirements.blocked_drive_impact_stun_required),
        not_crouching_required: Boolean(translated.requirements.not_crouching_required),
    };
}

export function useComboFillDetails(executionMode: ComboExecutionMode) {
    const {translateComboNotation, estimateComboDamage, estimateComboResources} = useCombos();

    const estimateDamage = useCallback(async (params: {characterId: string; notation: string; perfectParry: boolean; blockedDriveImpactStun: boolean}): Promise<string | null> => {
        const estimation = (await estimateComboDamage({
            characterId: params.characterId,
            notation: params.notation,
            executionMode,
            options: {
                perfectParry: params.perfectParry,
                driveRushMidCombo: false,
                driveImpactState: params.blockedDriveImpactStun ? "blocked_wallsplat" : "none",
                specialCancelIntoSa3: false,
            },
        })) as EstimateComboDamageResponse;

        return Number.isFinite(estimation.estimatedDamage) ? String(Math.trunc(estimation.estimatedDamage)) : null;
    }, [estimateComboDamage, executionMode]);

    const fillDetails = useCallback(async (input: ComboFillDetailsInput): Promise<ComboFillDetailsResult> => {
        const translated = (await translateComboNotation({characterId: input.characterId, notation: input.notation})) as TranslateComboNotationResponse;
        const parsedTokens = toParsedTokens(translated, input.notation);
        const steps = toTranslatedSteps(parsedTokens, translated, input.leafs, input.connections);
        const requirements = mergeTranslatedRequirements(input.requirements, translated);
        const notices: FormNotice[] = [];

        let damage: string | null = null;
        try {
            damage = await estimateDamage({
                characterId: input.characterId,
                notation: input.notation,
                perfectParry: Boolean(requirements.perfect_parry_required),
                blockedDriveImpactStun: Boolean(requirements.blocked_drive_impact_stun_required),
            });
        } catch {
            notices.push({severity: "warning", message: "Notation parsed but damage estimate is currently unavailable."});
        }

        let resources: ComboResourceValues = {};
        try {
            const estimate = (await estimateComboResources({
                characterId: input.characterId,
                steps: steps.map((step, index) => ({
                    child_sequence_id: step.move?.id ?? 0,
                    ordinal_in_combo: index + 1,
                    connection_type_id: step.connection?.id ?? null,
                })),
            })) as EstimateComboResourcesResponse;
            resources = toResourceValues(estimate);
        } catch {
            notices.push({severity: "warning", message: "Notation parsed but resource estimate is currently unavailable."});
        }

        if (steps.length === 0) {
            notices.push({severity: "warning", message: "No valid steps were parsed for this character."});
        } else if ((translated.errors ?? []).length > 0) {
            notices.push({severity: "warning", message: "Combo parsed partially. Review warnings and complete missing steps manually."});
        }

        return {
            steps,
            parsedTokens,
            warnings: translated.warnings ?? [],
            errors: translated.errors ?? [],
            requirements,
            defaultTitle: input.notation.trim().replace(/\s+/g, " ").slice(0, 70),
            damage,
            resources,
            notice: notices[notices.length - 1] ?? null,
        };
    }, [estimateComboResources, estimateDamage, translateComboNotation]);

    return {fillDetails, estimateDamage};
}
