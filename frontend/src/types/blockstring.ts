export interface BlockstringCharacter {
    id: string;
    name: string;
}

export interface BlockstringMove {
    id: string;
    numpadNotation: string;
    character?: BlockstringCharacter | null;
}

export interface BlockstringStep {
    id?: number;
    ordinal: number;
    move: BlockstringMove | null;
    canConfirmOnHit: boolean;
    note: string | null;
}

export type BlockstringGapTiming = "before_step" | "during_step";
export type BlockstringGapClassification = "safe" | "trades" | "fake";

export interface BlockstringGap {
    id?: number;
    stepOrdinal: number | null;
    timing: BlockstringGapTiming;
    frames: number;
    frameAdvantage: number;
    classification: BlockstringGapClassification;
    adaptationCount?: number;
}

export interface BlockstringAdaptationComboSearch {
    character: BlockstringCharacter | null;
    firstMove: BlockstringMove | null;
    enderMove: BlockstringMove | null;
    situation: {id: number; name: string; typeName: string; typeCode: string} | null;
    spacing: {id: number; code: string; name: string} | null;
    filters: Record<string, string | number | boolean | string[]>;
    url: string;
}

export interface BlockstringAdaptationStep {
    id?: number;
    ordinal: number;
    move: BlockstringMove | null;
}

export interface BlockstringAdaptation {
    id?: number;
    gapId: number | null;
    gapStepOrdinal: number | null;
    explanation: string | null;
    steps: BlockstringAdaptationStep[];
    comboSearch: BlockstringAdaptationComboSearch | null;
}

export interface BlockstringDefenseEntry {
    id?: number;
    gapId: number | null;
    gapStepOrdinal: number | null;
    instruction: string | null;
    exceptionNotes: string | null;
    defenderCharacter: BlockstringCharacter | null;
    move: BlockstringMove | null;
    responseType: "button" | "reversal" | "jump" | "backdash" | "block" | "movement";
    outcome: "counter_hit" | "punish_counter" | "trade" | "escape" | "reset_to_neutral" | "block";
    conversion: string | null;
}

export interface BlockstringCondition {
    id?: number;
    kind: string;
    value: string;
    note: string | null;
}

export interface BlockstringSummary {
    id: number;
    title: string;
    summary: string | null;
    classification: "true" | "frametrap" | "reset" | "fake" | "knowledge_check";
    moderationState: string;
    attackerCharacter: BlockstringCharacter | null;
    notation: string;
    steps: BlockstringStep[];
    gaps: BlockstringGap[];
    defenseEntryCount: number;
}

export interface BlockstringDetail extends BlockstringSummary {
    conditions: BlockstringCondition[];
    defenseEntries: BlockstringDefenseEntry[];
    adaptations: BlockstringAdaptation[];
}

export interface BlockstringSearchFilters {
    q?: string;
    attackerCharacterId?: string;
    defenderCharacterId?: string;
    moveId?: string;
    classification?: string;
    size?: number;
}

export interface BlockstringPayload {
    title: string;
    summary?: string | null;
    attackerCharacterId: string;
    classification: string;
    steps: Array<{
        moveId: string;
        ordinal?: number;
        canConfirmOnHit?: boolean;
        note?: string | null;
    }>;
    gaps?: Array<{
        clientId: string;
        stepOrdinal: number;
        timing: BlockstringGapTiming;
        frames: number | null;
        frameAdvantage?: number | null;
        classification?: BlockstringGapClassification;
    }>;
    conditions?: Array<{kind: string; value: string; note?: string | null}>;
    defenseEntries?: Array<{
        gapClientId?: string | null;
        instruction?: string | null;
        exceptionNotes?: string | null;
        defenderCharacterId?: string | null;
        moveId?: string | null;
        responseType?: string;
        outcome?: string;
        conversion?: string | null;
    }>;
    adaptations?: Array<{
        clientId: string;
        gapClientId: string;
        explanation?: string | null;
        steps: Array<{moveId: string; ordinal?: number}>;
        comboSearch?: {
            firstMoveId?: string | null;
            enderMoveId?: string | null;
            spacingCode?: string | null;
            minDamage?: number | null;
            maxDamage?: number | null;
            minDriveCost?: number | null;
            maxDriveCost?: number | null;
            counterHitRequired?: boolean | null;
            punishCounterRequired?: boolean | null;
            cornerRequired?: boolean | null;
        };
    }>;
}

export const BLOCKSTRING_CLASSIFICATIONS = ["true", "frametrap", "reset", "fake", "knowledge_check"] as const;

export function formatBlockstringLabel(value: string): string {
    return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
