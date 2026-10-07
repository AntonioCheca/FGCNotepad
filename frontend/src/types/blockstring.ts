import type {PressureEdgeKind} from "@/src/features/pressure-graph/pressureGraphTypes";

export interface BlockstringCharacter {
    id: string;
    name: string;
}

export interface BlockstringMove {
    id: string;
    numpadNotation: string;
    commonName: string | null;
    moveName: string | null;
    character?: BlockstringCharacter | null;
}

export interface BlockstringNode {
    id: string;
    move: BlockstringMove | null;
    frameAdvantage: number | null;
}

export interface BlockstringEdge {
    id: string;
    from: string;
    to: string;
    kind: PressureEdgeKind;
    readLabel: string | null;
    trueBlockstring: boolean;
    gapFrames: number | null;
}

export interface BlockstringBlock {
    id: number;
    description: string | null;
    nodes: BlockstringNode[];
    edges: BlockstringEdge[];
}

export interface BlockstringSummary {
    id: number;
    title: string;
    moderationState: string;
    attackerCharacter: BlockstringCharacter | null;
    startingMove: BlockstringMove | null;
}

export interface BlockstringDetail extends BlockstringSummary {
    blocks: BlockstringBlock[];
}

export interface BlockstringSearchFilters {
    q?: string;
    attackerCharacterId?: string;
    startingMoveId?: string;
}

export interface BlockstringPayload {
    title: string;
    attackerCharacterId: string;
    startingMoveId: string;
    blocks: Array<{
        description: string | null;
        nodes: Array<{clientId: string; moveId: string; frameAdvantage: number | null}>;
        edges: Array<{from: string; to: string; kind: PressureEdgeKind; readLabel: string | null; trueBlockstring: boolean; gapFrames: number | null}>;
    }>;
}
