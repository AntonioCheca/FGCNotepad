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

export interface MoveModernData {
    availableOnModern: boolean;
    modernMaxNotation: string | null;
    modernSimpleNotation: string | null;
    modernSimpleDamagePercent: number | null;
}

export type ModernAutoComboStrength = "light" | "medium" | "heavy";

export type ModernAutoCombos = Record<ModernAutoComboStrength, {comboId: number; name: string} | null>;

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
    modern: MoveModernData;
}

export interface FrameDataModerationMovesResponse {
    columns: FrameDataEditableColumn[];
    resources?: CharacterResource[];
    moves: FrameDataModerationMove[];
}
