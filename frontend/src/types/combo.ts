export type ID = number;

export interface ConnectionType {
    id: ID;
    name: string;
}

export interface LeafSequenceOption {
    id: ID;         // This should be the ComboSequence ID for a LEAF/Move wrapper
    name: string;
}

export interface StepDraft {
    move: LeafSequenceOption | null;
    connection: ConnectionType | null;
}

export interface CreateFullComboPayload {
    name: string;
    description?: string;
    metrics?: { damage?: number };
    steps: Array<{
        child_sequence_id: ID;
        ordinal_in_combo: number;
        connection_type_id: ID | null;
    }>;
}
