export type OkiStepType = "IMMEDIATE" | "WALK_FORWARD" | "WALK_BACKWARD" | "WAIT";
export type OkiOptionType = "STRIKE" | "MEATY_STRIKE" | "MEATY_THROW" | "SHIMMY" | "DELAY_STRIKE" | "DELAY_THROW";
export type OkiNodeProperty = "OVERHEAD" | "LOW" | "LEFT_RIGHT" | "SAFE_JUMP" | "FAKE_SAFE_JUMP" | "REVERSAL_BAIT" | "ANTI_DRIVE_REVERSAL" | "CHARACTER_SPECIFIC";
export type OkiInteractionResult = "WINS" | "LOSES" | "NEUTRAL" | "TRADES";
export type ReversalType = "OD_REVERSAL" | "SUPER" | "COMMAND_REVERSAL" | "OTHER";
export type ReversalProperty = "STRIKE_INVULNERABLE" | "THROW_INVULNERABLE" | "HITS_CROUCHING" | "WHIFFS_AGAINST_CROUCHING" | "AIR_INVULNERABLE";

export interface OkiCharacterRef {
    id: string;
    name: string;
}

export interface OkiMoveRef {
    id: string;
    numpadNotation: string;
    name: string;
    character: OkiCharacterRef;
}

export interface OkiSummaryFlags {
    meterless: boolean;
    driveRush: boolean;
    autoTimed: boolean;
    manual: boolean;
    cornerOnly: boolean;
    worksNoBackroll: boolean;
    worksBackroll: boolean;
    hasFakeSetups: boolean;
    optionTypes: OkiOptionType[];
    properties: OkiNodeProperty[];
}

export interface OkiProfileSummary {
    id: number;
    move: OkiMoveRef;
    frameAdvantage: number | null;
    setupCount: number;
    summary: OkiSummaryFlags;
}

export interface OkiOptionInteraction {
    id: number;
    defensiveMove: OkiMoveRef;
    result: OkiInteractionResult;
    character: OkiCharacterRef | null;
}

export interface OkiNode {
    id: number;
    move: OkiMoveRef;
    sortOrder: number;
    isDefaultRoute: boolean;
    routeExplanation: string | null;
    optionType: OkiOptionType | null;
    properties: OkiNodeProperty[];
    interactions: OkiOptionInteraction[];
}

export interface OkiNodeLink {
    id: number;
    fromNodeId: number;
    toNodeId: number;
    stepType: OkiStepType;
    minFrames: number | null;
    maxFrames: number | null;
}

export interface OkiSetup {
    id: number;
    usesDriveRush: boolean;
    autoTimed: boolean;
    cornerOnly: boolean;
    worksNoBackroll: boolean;
    worksBackroll: boolean;
    fakeNoBackroll: boolean;
    fakeBackroll: boolean;
    nodes: OkiNode[];
    links: OkiNodeLink[];
}

export interface OkiProfileDetail extends OkiProfileSummary {
    setups: OkiSetup[];
}

export interface OkiSearchFilters {
    q?: string;
    characterId?: string;
    moveId?: string;
    usesDriveRush?: boolean;
    autoTimed?: boolean;
    cornerOnly?: boolean;
    worksNoBackroll?: boolean;
    worksBackroll?: boolean;
    hasFakeSetups?: boolean;
    optionType?: OkiOptionType;
    property?: OkiNodeProperty;
}

export interface OkiInteractionPayload {
    defensiveMoveId: string;
    result: OkiInteractionResult;
    characterId?: string | null;
}

export interface OkiNodePayload {
    clientId: string;
    moveId: string;
    sortOrder?: number;
    isDefaultRoute?: boolean;
    routeExplanation?: string | null;
    optionType?: OkiOptionType | null;
    properties?: OkiNodeProperty[];
    interactions?: OkiInteractionPayload[];
}

export interface OkiNodeLinkPayload {
    fromClientId: string;
    toClientId: string;
    stepType: OkiStepType;
    minFrames?: number | null;
    maxFrames?: number | null;
}

export interface OkiSetupPayload {
    usesDriveRush: boolean;
    autoTimed: boolean;
    cornerOnly: boolean;
    worksNoBackroll: boolean;
    worksBackroll: boolean;
    fakeNoBackroll: boolean;
    fakeBackroll: boolean;
    nodes: OkiNodePayload[];
    links: OkiNodeLinkPayload[];
}

export interface OkiProfilePayload {
    moveId: string;
    setups: OkiSetupPayload[];
}

export interface CharacterReversalPayload {
    characterId: string;
    moveId: string;
    startup: number;
    reversalType: ReversalType;
    properties: ReversalProperty[];
}

export interface CharacterReversal {
    id: number;
    character: OkiCharacterRef;
    move: OkiMoveRef;
    startup: number;
    reversalType: ReversalType;
    properties: ReversalProperty[];
}

export const OKI_OPTION_TYPES: OkiOptionType[] = ["STRIKE", "MEATY_STRIKE", "MEATY_THROW", "SHIMMY", "DELAY_STRIKE", "DELAY_THROW"];
export const OKI_NODE_PROPERTIES: OkiNodeProperty[] = ["OVERHEAD", "LOW", "LEFT_RIGHT", "SAFE_JUMP", "FAKE_SAFE_JUMP", "REVERSAL_BAIT", "ANTI_DRIVE_REVERSAL", "CHARACTER_SPECIFIC"];
export const OKI_STEP_TYPES: OkiStepType[] = ["IMMEDIATE", "WALK_FORWARD", "WALK_BACKWARD", "WAIT"];
export const OKI_INTERACTION_RESULTS: OkiInteractionResult[] = ["WINS", "LOSES", "NEUTRAL", "TRADES"];
export const REVERSAL_TYPES: ReversalType[] = ["OD_REVERSAL", "SUPER", "COMMAND_REVERSAL", "OTHER"];
export const REVERSAL_PROPERTIES: ReversalProperty[] = ["STRIKE_INVULNERABLE", "THROW_INVULNERABLE", "HITS_CROUCHING", "WHIFFS_AGAINST_CROUCHING", "AIR_INVULNERABLE"];

export function formatOkiLabel(value: string): string {
    return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
