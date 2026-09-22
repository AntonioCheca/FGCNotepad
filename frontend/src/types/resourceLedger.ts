export interface ResourceLedgerStep {
    ordinal: number;
    notation: string;
    delta: number;
    before: number;
    after: number;
}

export interface ResourceLedgerEntry {
    resource: {
        id: number;
        object_key: string;
        name: string;
        kind: "stock" | "scaler" | "state";
        min_status: number;
        max_status: number | null;
    };
    start: number;
    end: number;
    spent: number;
    gained: number;
    steps: ResourceLedgerStep[];
    warnings: string[];
}
