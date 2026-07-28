export type SituationOpponentState = "grounded" | "airborne";
export type SituationJuggleAltitude = "low" | "medium" | "high";
export type SituationCornerState = "midscreen" | "corner" | "either";
export type SituationCounterHitState = "normal" | "counter_hit" | "punish_counter";
export type CompatibilityStatus = "compatible" | "incompatible" | "uncertain";

export interface SituationTypeOption {
    id: number;
    code: string;
    name: string;
    description: string;
}

export interface SituationSummary {
    id: number;
    type: SituationTypeOption;
    name: string;
    description: string;
    opponentCharacter: {id: string; name: string} | null;
    move: {id: string; name: string; notation: string} | null;
    frameAdvantage: number | null;
    punishWindowFrames: number | null;
    startingDistanceMeters: number | null;
    opponentState: SituationOpponentState;
    initialJuggleAltitude: SituationJuggleAltitude | null;
    cornerState: SituationCornerState;
    counterHitState: SituationCounterHitState;
    notes: string | null;
    isVerified: boolean;
    isArchived: boolean;
}

export interface CompatibilityResultPayload {
    status: CompatibilityStatus;
    reasons: string[];
    warnings: string[];
}

export interface SituationPayload {
    typeId: number;
    name: string;
    description?: string;
    opponentCharacterId?: string | null;
    moveId?: string | null;
    frameAdvantage?: number | null;
    punishWindowFrames?: number | null;
    startingDistanceMeters?: number | null;
    opponentState: SituationOpponentState;
    initialJuggleAltitude?: SituationJuggleAltitude | null;
    cornerState: SituationCornerState;
    counterHitState: SituationCounterHitState;
    notes?: string | null;
    isVerified?: boolean;
    isArchived?: boolean;
}
