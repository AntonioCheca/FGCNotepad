import {isDelayConnection} from "@/src/types/combo";
import type {ComboRequirementsPayload, ConnectionType, CreateFullComboPayload, LeafSequenceOption, StepDraft} from "@/src/types/combo";

export function buildCreateFullComboPayload(params: {
    title: string;
    inputNotation: string;
    damage: string;
    driveCost: string;
    driveGain: string;
    minimumDriveCost?: string;
    minimumDriveCostNoBurnout?: string;
    superCost: string;
    superGain: string;
    spacingCode?: string;
    requirements?: ComboRequirementsPayload;
    steps: StepDraft[];
}): CreateFullComboPayload {
    const {title, inputNotation, damage, driveCost, driveGain, minimumDriveCost = "", minimumDriveCostNoBurnout = "", superCost, superGain, spacingCode = "", requirements, steps} = params;
    const metrics = buildMetricsPayload({damage, driveCost, driveGain, minimumDriveCost, minimumDriveCostNoBurnout, superCost, superGain});

    return {
        name: title,
        inputNotation: inputNotation.trim() || null,
        spacingCode: spacingCode || null,
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

export function parseOptionalNumber(value: string): number | undefined {
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
