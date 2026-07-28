export interface FrameDataEditableColumn {
    columnName: string;
    label: string;
    type: "integer" | "string";
}

export interface FrameDataModerationValue {
    baseValue: number | string | null;
    effectiveValue: number | string | null;
    isOverridden: boolean;
}

export interface FrameDataModerationMove {
    moveId: string;
    frameDataId: string;
    name: string;
    numpadNotation: string;
    values: Record<string, FrameDataModerationValue>;
    manualMetadata: {
        whiffOnCrouch: boolean;
        forcesStanding: boolean;
    };
}

export interface FrameDataModerationMovesResponse {
    columns: FrameDataEditableColumn[];
    moves: FrameDataModerationMove[];
}
