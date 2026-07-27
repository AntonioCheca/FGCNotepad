import {isDelayConnection} from "@/src/types/combo";
import type {
    ComboRequirementsPayload,
    ComboObjectStateDraft,
    ConnectionType,
    CreateFullComboPayload,
    LeafSequenceOption,
    RequirementObjectOption,
    StepDraft,
    TranslateComboNotationResponse,
    TranslateParsedToken,
} from "@/src/types/combo";

export type RequirementToggleKey =
    | "counter_hit_required"
    | "punish_counter_required"
    | "corner_required"
    | "airborne_required"
    | "not_crouching_required"
    | "side_switches_required";

export type FormNotice = {
    severity: "success" | "info" | "warning" | "error";
    message: string;
};

export const requirementToggles: Array<{ key: RequirementToggleKey; label: string }> = [
    {key: "counter_hit_required", label: "Counter Hit Required"},
    {key: "punish_counter_required", label: "Punish Counter Required"},
    {key: "corner_required", label: "Corner Required"},
    {key: "airborne_required", label: "Airborne Required"},
    {key: "not_crouching_required", label: "Opponent Not Crouching"},
    {key: "side_switches_required", label: "Side Switches Required"},
];

export const emptyRequirements: ComboRequirementsPayload = {
    counter_hit_required: false,
    punish_counter_required: false,
    corner_required: false,
    airborne_required: false,
    not_crouching_required: false,
    side_switches_required: false,
};

export function createEmptyStep(): StepDraft {
    return {
        move: null,
        connection: null,
        delay_type: "fixed",
        delay_frames: "",
        delay_min_frames: "",
        delay_max_frames: "",
        delay_min_unverified: false,
        delay_max_unverified: false,
    };
}

export function getDelayLabel(step: StepDraft): string | null {
    if (!isDelayConnection(step.connection)) {
        return null;
    }

    const delayType = step.delay_type ?? "fixed";
    if (delayType === "fixed") {
        const delay = (step.delay_frames ?? "").trim();
        return delay.length > 0 ? `${delay}f` : "Delay ?";
    }

    const min = (step.delay_min_frames ?? "").trim();
    const max = (step.delay_max_frames ?? "").trim();
    const minStatus = step.delay_min_unverified ? "?" : "";
    const maxStatus = step.delay_max_unverified ? "?" : "";

    if (min.length === 0 || max.length === 0) {
        return "Window ?";
    }

    return `${min}${minStatus}-${max}${maxStatus}f`;
}

export function parseNotationTokens(notationInput: string): string[] {
    return notationInput
        .split(/[\s,\t\n]+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
        .slice(0, 14);
}

export function updateDraftStep(currentStep: StepDraft, update: Partial<StepDraft>): StepDraft {
    const nextStep: StepDraft = {
        ...createEmptyStep(),
        ...currentStep,
        ...update,
    };

    if (Object.prototype.hasOwnProperty.call(update, "connection") && !isDelayConnection(nextStep.connection)) {
        return {
            ...nextStep,
            delay_type: "fixed",
            delay_frames: "",
            delay_min_frames: "",
            delay_max_frames: "",
            delay_min_unverified: false,
            delay_max_unverified: false,
        };
    }

    if (isDelayConnection(nextStep.connection) && !nextStep.delay_type) {
        return {
            ...nextStep,
            delay_type: "fixed",
        };
    }

    return nextStep;
}

export function toParsedTokens(translated: TranslateComboNotationResponse, notationInput: string): TranslateParsedToken[] {
    if ((translated.parsedTokens ?? []).length > 0) {
        return translated.parsedTokens;
    }

    return parseNotationTokens(notationInput).map((token, index) => ({
        index: index + 1,
        token,
        normalizedToken: token,
        status: "pending",
        child_sequence_id: null,
        reason: null,
    }));
}

export function toTranslatedSteps(
    parsedTokens: TranslateParsedToken[],
    translated: TranslateComboNotationResponse,
    leafs: LeafSequenceOption[],
    connections: ConnectionType[],
): StepDraft[] {
    const leafById = new Map<string, LeafSequenceOption>(leafs.map((leaf) => [String(leaf.id), leaf]));
    const connectionById = new Map<string, ConnectionType>(connections.map((connection) => [String(connection.id), connection]));

    let recognizedStepCursor = 0;
    return parsedTokens.map((token) => {
        if (token.child_sequence_id === null) {
            return createEmptyStep();
        }

        const translatedStep = translated.steps[recognizedStepCursor];
        recognizedStepCursor += 1;

        return {
            ...createEmptyStep(),
            move: leafById.get(String(token.child_sequence_id)) ?? null,
            connection: translatedStep?.connection_type_id
                ? connectionById.get(String(translatedStep.connection_type_id)) ?? null
                : null,
        };
    });
}

export function validateSteps(steps: StepDraft[]): string | null {
    if (steps.length === 0) {
        return "Add at least one step.";
    }

    for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
        const currentStep = steps[stepIndex];
        if (!currentStep.move?.id) {
            return `Step ${stepIndex + 1}: select a move.`;
        }

        if (stepIndex > 0 && !currentStep.connection?.id) {
            return `Step ${stepIndex + 1}: select a connection type.`;
        }

        if (isDelayConnection(currentStep.connection)) {
            const delayType = currentStep.delay_type ?? "fixed";

            if (delayType === "fixed") {
                const delayFrames = (currentStep.delay_frames ?? "").trim();
                if (!/^[0-9]+$/.test(delayFrames)) {
                    return `Step ${stepIndex + 1}: delay frames must be a non-negative integer.`;
                }
            } else {
                const delayMin = (currentStep.delay_min_frames ?? "").trim();
                const delayMax = (currentStep.delay_max_frames ?? "").trim();

                if (!/^[0-9]+$/.test(delayMin) || !/^[0-9]+$/.test(delayMax)) {
                    return `Step ${stepIndex + 1}: delay min/max must be non-negative integers.`;
                }

                if (Number.parseInt(delayMin, 10) > Number.parseInt(delayMax, 10)) {
                    return `Step ${stepIndex + 1}: delay min cannot be greater than delay max.`;
                }
            }
        }
    }

    return null;
}

export function getCompletedStepsCount(steps: StepDraft[]): number {
    return steps.filter((step, index) => Boolean(step.move?.id) && (index === 0 || Boolean(step.connection?.id))).length;
}

function resolveSpecificStatusPayload(
    selectedRequirementObject: RequirementObjectOption | null,
    specificRequirementStatus: string,
): {value?: string | number | boolean; error?: string} {
    const statusRequiredRaw = specificRequirementStatus.trim();
    const selectedObjectIsBoolean = selectedRequirementObject?.status_type === "boolean";
    const selectedObjectIsInteger = selectedRequirementObject?.status_type === "integer";

    if (selectedObjectIsBoolean) {
        return {value: true};
    }

    if (selectedObjectIsInteger) {
        if (!/^[0-9]+$/.test(statusRequiredRaw)) {
            return {error: "This requirement needs a numeric status."};
        }

        const numericStatus = Number.parseInt(statusRequiredRaw, 10);
        const maxStatus = selectedRequirementObject?.max_status ?? null;

        if (numericStatus < 1 || (maxStatus !== null && numericStatus > maxStatus)) {
            return {error: `Status must be between 1 and ${maxStatus}.`};
        }

        return {value: numericStatus};
    }

    return {error: "Requirement status is invalid."};
}

function resolveObjectStateValue(option: RequirementObjectOption, value: string, fieldLabel: string): {value?: string | number | boolean; error?: string} {
    const rawValue = value.trim();
    if (option.status_type === "boolean") {
        return {value: true};
    }

    if (!/^[0-9]+$/.test(rawValue)) {
        return {error: `${option.name} ${fieldLabel} needs a numeric value.`};
    }

    const numericValue = Number.parseInt(rawValue, 10);
    if (numericValue < 1 || (option.max_status !== null && numericValue > option.max_status)) {
        return {error: `${option.name} ${fieldLabel} must be between 1 and ${option.max_status}.`};
    }

    return {value: numericValue};
}

export function buildRequirementsPayload(params: {
    requirements: ComboRequirementsPayload;
    specificRequirementObject: string;
    specificRequirementStatus: string;
    selectedRequirementObject: RequirementObjectOption | null;
    objectStates?: ComboObjectStateDraft[];
    requirementObjects?: RequirementObjectOption[];
}): {payload?: ComboRequirementsPayload; error?: string} {
    const {requirements, specificRequirementObject, specificRequirementStatus, selectedRequirementObject, objectStates = [], requirementObjects = []} = params;
    const objectName = specificRequirementObject.trim();
    const statusRequiredRaw = specificRequirementStatus.trim();
    const hasBooleanRequirement = requirementToggles.some(({key}) => Boolean(requirements[key]));
    const hasAnyObjectStateInput = objectName.length > 0 || statusRequiredRaw.length > 0 || objectStates.length > 0;

    if (statusRequiredRaw.length > 0 && !objectName) {
        return {error: "Select a requirement object before entering a status."};
    }

    if (objectName.length > 0 && !selectedRequirementObject) {
        return {error: "Invalid requirement object selected."};
    }

    if (!hasBooleanRequirement && !hasAnyObjectStateInput) {
        return {payload: undefined};
    }

    const comboObjectStates = [];
    for (const objectState of objectStates) {
        const option = requirementObjects.find((candidate) => candidate.object_key === objectState.object_key) ?? null;
        if (!option) {
            return {error: "Invalid combo object selected."};
        }

        const nextState: NonNullable<ComboRequirementsPayload["combo_object_states"]>[number] = {
            object_key: option.object_key,
            character_name: option.character_name,
            object_name: option.name,
        };

        if (objectState.status_required.trim().length > 0 || option.status_type === "boolean" && objectState.status_required === "true") {
            const result = resolveObjectStateValue(option, objectState.status_required, "required status");
            if (result.error) {
                return {error: result.error};
            }
            nextState.status_required = result.value;
        }

        if (objectState.consumed) {
            if (!option.can_be_consumed) {
                return {error: `${option.name} cannot be consumed.`};
            }
            nextState.consumed = true;
        }

        if (objectState.added_relative.trim().length > 0 || option.status_type === "boolean" && objectState.added_relative === "true") {
            if (!option.can_be_added_relative) {
                return {error: `${option.name} cannot be added relatively.`};
            }
            const result = resolveObjectStateValue(option, objectState.added_relative, "relative add");
            if (result.error) {
                return {error: result.error};
            }
            nextState.added_relative = result.value;
        }

        if (objectState.added_absolute.trim().length > 0 || option.status_type === "boolean" && objectState.added_absolute === "true") {
            if (!option.can_be_added_absolute) {
                return {error: `${option.name} cannot be added absolutely.`};
            }
            if (nextState.added_relative !== undefined) {
                return {error: `${option.name} cannot have both relative and absolute added values.`};
            }
            const result = resolveObjectStateValue(option, objectState.added_absolute, "absolute add");
            if (result.error) {
                return {error: result.error};
            }
            nextState.added_absolute = result.value;
        }

        if (nextState.status_required !== undefined || nextState.consumed || nextState.added_relative !== undefined || nextState.added_absolute !== undefined) {
            comboObjectStates.push(nextState);
        }
    }

    if (objectName.length === 0) {
        return {
            payload: {
                ...emptyRequirements,
                ...requirements,
                combo_object_states: comboObjectStates.length > 0 ? comboObjectStates : undefined,
            },
        };
    }

    const specificStatusResult = resolveSpecificStatusPayload(selectedRequirementObject, specificRequirementStatus);
    if (specificStatusResult.error) {
        return {error: specificStatusResult.error};
    }

    return {
        payload: {
            ...emptyRequirements,
            ...requirements,
            requirement_specific_character: {
                object_key: selectedRequirementObject?.object_key,
                character_name: selectedRequirementObject?.character_name,
                object_name: selectedRequirementObject?.name ?? objectName,
                status_required: specificStatusResult.value as string | number | boolean,
            },
            combo_object_states: comboObjectStates.length > 0 ? comboObjectStates : undefined,
        },
    };
}

export function buildCreateFullComboPayload(params: {
    title: string;
    description: string;
    damage: string;
    driveCost: string;
    driveGain: string;
    minimumDriveCost?: string;
    minimumDriveCostNoBurnout?: string;
    superCost: string;
    superGain: string;
    requirements?: ComboRequirementsPayload;
    steps: StepDraft[];
}): CreateFullComboPayload {
    const {title, description, damage, driveCost, driveGain, minimumDriveCost = "", minimumDriveCostNoBurnout = "", superCost, superGain, requirements, steps} = params;
    const metrics = buildMetricsPayload({damage, driveCost, driveGain, minimumDriveCost, minimumDriveCostNoBurnout, superCost, superGain});

    return {
        name: title,
        description: description || undefined,
        metrics,
        requirements,
        steps: steps.map((step, index) => {
            const baseStep = {
                child_sequence_id: (step.move as LeafSequenceOption).id,
                ordinal_in_combo: index + 1,
                connection_type_id: (step.connection as ConnectionType | null)?.id ?? null,
            };

            if (!isDelayConnection(step.connection)) {
                return baseStep;
            }

            if ((step.delay_type ?? "fixed") === "window") {
                const delayMinUnverified = Boolean(step.delay_min_unverified);
                const delayMaxUnverified = Boolean(step.delay_max_unverified);

                return {
                    ...baseStep,
                    delay_min_frames: Number.parseInt((step.delay_min_frames ?? "0").trim(), 10),
                    delay_max_frames: Number.parseInt((step.delay_max_frames ?? "0").trim(), 10),
                    ...(delayMinUnverified ? {delay_min_unverified: true} : {}),
                    ...(delayMaxUnverified ? {delay_max_unverified: true} : {}),
                };
            }

            return {
                ...baseStep,
                delay_frames: Number.parseInt((step.delay_frames ?? "0").trim(), 10),
            };
        }),
    };
}

function parseOptionalNumber(value: string): number | undefined {
    const trimmed = value.trim();
    if (trimmed === "") {
        return undefined;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function buildMetricsPayload(values: {
    damage: string;
    driveCost: string;
    driveGain: string;
    minimumDriveCost: string;
    minimumDriveCostNoBurnout: string;
    superCost: string;
    superGain: string;
}): CreateFullComboPayload["metrics"] {
    const damage = parseOptionalNumber(values.damage);
    if (damage === undefined) {
        return undefined;
    }

    return {
        damage: Math.trunc(damage),
        driveCost: parseOptionalNumber(values.driveCost),
        driveGain: parseOptionalNumber(values.driveGain),
        minimumDriveCost: parseOptionalNumber(values.minimumDriveCost),
        minimumDriveCostNoBurnout: parseOptionalNumber(values.minimumDriveCostNoBurnout),
        superCost: parseOptionalNumber(values.superCost),
        superGain: parseOptionalNumber(values.superGain),
    };
}
