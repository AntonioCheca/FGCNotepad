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
