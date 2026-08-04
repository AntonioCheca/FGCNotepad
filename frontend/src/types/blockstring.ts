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

export type BlockstringConnectionType = "guaranteed" | "gap" | "manual_delay" | "hit_confirm" | "not_confirmable";

export interface BlockstringRouteConnection {
    id?: number;
    ordinal: number;
    type: BlockstringConnectionType;
    sourceStepId: number | null;
    sourceStepOrdinal: number | null;
    destinationStepId: number | null;
    destinationStepOrdinal: number | null;
    gap: BlockstringGap | null;
}

export interface BlockstringRoute {
    id?: number;
    name: string;
    displayOrder: number;
    isMain: boolean;
    tacticalReasonText: string | null;
    branchAnchor: {
        stepId: number | null;
        stepOrdinal: number | null;
        connectionId: number | null;
    };
    steps: BlockstringStep[];
    connections: BlockstringRouteConnection[];
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
    routes: BlockstringRoute[];
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
    routes?: Array<{
        clientId: string;
        name: string;
        displayOrder: number;
        isMain: boolean;
        tacticalReasonText?: string | null;
        branchAnchor?: {stepClientId?: string | null; connectionClientId?: string | null} | null;
        steps: Array<{clientId: string; moveId: string; ordinal?: number; note?: string | null}>;
        connections: Array<{
            clientId: string;
            sourceStepClientId?: string | null;
            destinationStepClientId: string;
            ordinal?: number;
            type: BlockstringConnectionType;
            gapClientId?: string | null;
            gapFrames?: number | null;
            gapTiming?: BlockstringGapTiming;
            frameAdvantage?: number | null;
            classification?: BlockstringGapClassification;
        }>;
    }>;
}

export const BLOCKSTRING_CLASSIFICATIONS = ["true", "frametrap", "reset", "fake", "knowledge_check"] as const;
export const BLOCKSTRING_CONNECTION_TYPES: BlockstringConnectionType[] = ["guaranteed", "gap", "manual_delay", "hit_confirm", "not_confirmable"];

export function formatBlockstringLabel(value: string): string {
    return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
