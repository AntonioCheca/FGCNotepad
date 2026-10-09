import {isDelayConnection} from "@/src/types/combo";
import type {ConnectionType, LeafSequenceOption, StepDraft, TranslateComboNotationResponse, TranslateParsedToken} from "@/src/types/combo";

export type FormNotice = {
    severity: "success" | "info" | "warning" | "error";
    message: string;
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

// The first problem that blocks saving, phrased for the field it concerns.
export function validateComboDraft(params: {title: string; damage: string; steps: StepDraft[]}): string | null {
    if (!params.title.trim()) {
        return "Add a combo title.";
    }

    if (!params.damage.trim()) {
        return "Add the combo damage, or use Fill Details.";
    }

    return validateSteps(params.steps);
}
