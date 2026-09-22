import {CharacterResource} from "@/src/types/characterResource";

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

export interface MoveResourceEffect {
    resourceId: number;
    resourceName: string;
    mode: "relative" | "set";
    amount: number;
    source: "manual" | "inferred";
    observationCount: number;
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
    resourceEffects?: MoveResourceEffect[];
}

export interface FrameDataModerationMovesResponse {
    columns: FrameDataEditableColumn[];
    resources?: CharacterResource[];
    moves: FrameDataModerationMove[];
}
