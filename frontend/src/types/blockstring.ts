import type {PressureEdgeKind} from "@/src/features/pressure-graph/pressureGraphTypes";

export interface BlockstringCharacter {
    id: string;
    name: string;
}

export interface BlockstringMove {
    id: string;
    numpadNotation: string;
    moveName: string | null;
    character?: BlockstringCharacter | null;
}

export interface BlockstringNode {
    id: string;
    move: BlockstringMove | null;
    layer: number;
    damageDealt: number | null;
    damageReceived: number | null;
}

export interface BlockstringEdge {
    id: string;
    from: string;
    to: string;
    kind: PressureEdgeKind;
    readLabel: string | null;
    layer: number;
    frameAdvantage: number | null;
    gapFrames: number | null;
}

export interface BlockstringGapSummary {
    from: string | null;
    to: string | null;
    gapFrames: number;
    frameAdvantage: number | null;
    kind: PressureEdgeKind;
}

export type BlockstringResponseType = "button" | "reversal" | "jump" | "backdash" | "block" | "movement";
export type BlockstringDefenseOutcome = "counter_hit" | "punish_counter" | "trade" | "escape" | "reset_to_neutral" | "block";

export interface BlockstringDefenseEntry {
    id?: number;
    edgeId: string;
    instruction: string | null;
    exceptionNotes: string | null;
    defenderCharacter: BlockstringCharacter | null;
    move: BlockstringMove | null;
    responseType: BlockstringResponseType;
    outcome: BlockstringDefenseOutcome;
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
    nodeCount: number;
    defenseEntryCount: number;
    gaps: BlockstringGapSummary[];
}

export interface BlockstringDetail extends BlockstringSummary {
    nodes: BlockstringNode[];
    edges: BlockstringEdge[];
    conditions: BlockstringCondition[];
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

export interface BlockstringDefenseEntryPayload {
    edgeClientId: string;
    instruction?: string | null;
    exceptionNotes?: string | null;
    defenderCharacterId?: string | null;
    moveId?: string | null;
    responseType?: BlockstringResponseType;
    outcome?: BlockstringDefenseOutcome;
    conversion?: string | null;
}

export interface BlockstringPayload {
    title: string;
    summary?: string | null;
    attackerCharacterId: string;
    classification: string;
    nodes: Array<{
        clientId: string;
        moveId: string;
        layer: number;
        damageDealt: number | null;
        damageReceived: number | null;
    }>;
    edges: Array<{
        clientId: string;
        from: string;
        to: string;
        kind: PressureEdgeKind;
        readLabel: string | null;
        layer: number;
        frameAdvantage: number | null;
        gapFrames: number | null;
    }>;
    conditions?: Array<{kind: string; value: string; note?: string | null}>;
    defenseEntries?: BlockstringDefenseEntryPayload[];
}

export const BLOCKSTRING_CLASSIFICATIONS = ["true", "frametrap", "reset", "fake", "knowledge_check"] as const;

export function formatBlockstringLabel(value: string): string {
    return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
