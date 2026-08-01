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
    gapBefore: boolean;
    gapFrames: number | null;
    canConfirmOnHit: boolean;
    note: string | null;
}

export interface BlockstringOffensePlan {
    id?: number;
    label: string;
    planRole: "default" | "safe" | "risky" | "situational";
    targetBehavior: string | null;
    purpose: string | null;
    onHit: string | null;
    onBlock: string | null;
    losesTo: string | null;
    authorExplanation: string | null;
    sortOrder: number;
}

export interface BlockstringDefenseAnswer {
    id?: number;
    defenderCharacter: BlockstringCharacter | null;
    move: BlockstringMove | null;
    responseType: "button" | "reversal" | "jump" | "backdash" | "block" | "movement";
    startupFrames: number | null;
    outcome: "counter_hit" | "punish_counter" | "trade" | "escape" | "reset_to_neutral" | "block";
    conversion: string | null;
    recommended: boolean;
}

export interface BlockstringDefenseEntry {
    id?: number;
    actAfterStep: number | null;
    instruction: string | null;
    exceptionNotes: string | null;
    answers: BlockstringDefenseAnswer[];
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
    gapAfterStep: number | null;
    maxInterruptStartup: number | null;
    moderationState: string;
    attackerCharacter: BlockstringCharacter | null;
    notation: string;
    steps: BlockstringStep[];
    offensePlanCount: number;
    defenseEntryCount: number;
}

export interface BlockstringDetail extends BlockstringSummary {
    conditions: BlockstringCondition[];
    offensePlans: BlockstringOffensePlan[];
    defenseEntries: BlockstringDefenseEntry[];
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
    gapAfterStep?: number | null;
    maxInterruptStartup?: number | null;
    steps: Array<{
        moveId: string;
        ordinal?: number;
        gapBefore?: boolean;
        gapFrames?: number | null;
        canConfirmOnHit?: boolean;
        note?: string | null;
    }>;
    conditions?: Array<{kind: string; value: string; note?: string | null}>;
    offensePlans?: Array<Partial<BlockstringOffensePlan>>;
    defenseEntries?: Array<{
        actAfterStep?: number | null;
        instruction?: string | null;
        exceptionNotes?: string | null;
        answers?: Array<{
            defenderCharacterId?: string | null;
            moveId?: string | null;
            responseType?: string;
            startupFrames?: number | null;
            outcome?: string;
            conversion?: string | null;
            recommended?: boolean;
        }>;
    }>;
}

export const BLOCKSTRING_CLASSIFICATIONS = ["true", "frametrap", "reset", "fake", "knowledge_check"] as const;

export function formatBlockstringLabel(value: string): string {
    return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
