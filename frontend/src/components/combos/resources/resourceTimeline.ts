import type {ComboRequirement, RequirementSpecificCharacterPayload} from "@/src/types/combo";
import type {ResourceLedgerEntry} from "@/src/types/resourceLedger";

export interface StepResourceChange {
    key: string;
    label: string;
    delta: number;
}

function changeLabel(entry: ResourceLedgerEntry, delta: number): string {
    if (entry.resource.kind === "state") {
        return `${entry.resource.name} ${delta > 0 ? "on" : "off"}`;
    }

    return `${delta > 0 ? "+" : ""}${delta} ${entry.resource.name}`;
}

export function resourceChangesByOrdinal(ledger: ResourceLedgerEntry[]): Map<number, StepResourceChange[]> {
    const changes = new Map<number, StepResourceChange[]>();
    for (const entry of ledger) {
        for (const step of entry.steps) {
            if (step.delta === 0) {
                continue;
            }
            const stepChanges = changes.get(step.ordinal) ?? [];
            stepChanges.push({key: entry.resource.object_key, label: changeLabel(entry, step.delta), delta: step.delta});
            changes.set(step.ordinal, stepChanges);
        }
    }

    return changes;
}

export function resourceLedgerWarnings(ledger: ResourceLedgerEntry[]): string[] {
    return ledger.flatMap((entry) => entry.warnings);
}

function startingRequirementLabel(state: RequirementSpecificCharacterPayload): string | null {
    const required = state.status_required;
    if (!state.object_name || required === undefined || required === null || required === false || required === "") {
        return null;
    }

    return required === true || required === "true" ? `${state.object_name} active` : `${String(required)} ${state.object_name}`;
}

export function startingRequirementLabels(requirements: ComboRequirement | null): string[] {
    const states = requirements?.combo_object_states ?? (requirements?.requirement_specific_character ? [requirements.requirement_specific_character] : []);

    return states.map(startingRequirementLabel).filter((label): label is string => label !== null);
}
