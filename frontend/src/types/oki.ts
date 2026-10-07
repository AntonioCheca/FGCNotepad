import type {PressureEdgeKind} from "@/src/features/pressure-graph/pressureGraphTypes";

export type OkiAction = "BLOCK" | "SHIMMY" | "WALK_FORWARD" | "WALK_BACKWARD" | "NEUTRAL_JUMP" | "FORWARD_JUMP" | "BACK_JUMP" | "BACKDASH";
export type OkiStepType = "IMMEDIATE" | "DELAY";
export type OkiHitLevel = "LOW" | "OVERHEAD";
export type OkiRecovery = "BACKROLL" | "RISE_IN_PLACE";

export interface OkiCharacterRef {
    id: string;
    name: string;
}

export interface OkiMoveRef {
    id: string;
    numpadNotation: string;
    name: string;
    commonName: string | null;
    moveName: string | null;
    moveType: string | null;
    character: OkiCharacterRef;
}

export interface OkiProfileSummary {
    id: number;
    move: OkiMoveRef;
    setupCount: number;
}

export interface OkiNode {
    id: number;
    move: OkiMoveRef | null;
    action: OkiAction | null;
    sortOrder: number;
    hitLevel: OkiHitLevel | null;
    sideSwitch: boolean;
}

// A null fromNodeId is a step taken straight from the ender.
export interface OkiNodeLink {
    id: number;
    fromNodeId: number | null;
    toNodeId: number;
    stepType: OkiStepType;
    kind: PressureEdgeKind;
    readLabel: string | null;
    safeJump: boolean;
    recovery: OkiRecovery | null;
}

export type OkiModerationState = "pending_review" | "approved" | "rejected" | "hidden";

export interface OkiSetup {
    id: number;
    moderationState: OkiModerationState;
    moderationReason: string | null;
    author: string | null;
    canEdit: boolean;
    name: string;
    cornerOnly: boolean;
    backrollDependent: boolean;
    nodes: OkiNode[];
    links: OkiNodeLink[];
}

export interface OkiProfileDetail extends OkiProfileSummary {
    setups: OkiSetup[];
}

export interface OkiSearchFilters {
    characterId?: string;
    moveId?: string;
}

export interface OkiNodePayload {
    clientId: string;
    moveId?: string | null;
    action?: OkiAction | null;
    sortOrder?: number;
    hitLevel?: OkiHitLevel | null;
    sideSwitch?: boolean;
}

export interface OkiNodeLinkPayload {
    fromClientId: string;
    toClientId: string;
    stepType: OkiStepType;
    kind?: PressureEdgeKind;
    readLabel?: string | null;
    safeJump?: boolean;
    recovery?: OkiRecovery | null;
}

export interface OkiSetupPayload {
    id?: number;
    name: string;
    cornerOnly: boolean;
    backrollDependent: boolean;
    nodes: OkiNodePayload[];
    links: OkiNodeLinkPayload[];
}

export interface OkiProfilePayload {
    moveId: string;
    setups: OkiSetupPayload[];
}
