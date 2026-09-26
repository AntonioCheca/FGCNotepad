export interface NeutralOption {
    value: string;
    label: string;
}

export interface NeutralCharacterOption {
    id: string;
    name: string;
    life: number;
}

export interface NeutralResourceOption {
    key: string;
    label: string;
    values: Array<{value: number; label: string}>;
}

export interface NeutralStatsOptions {
    characters: NeutralCharacterOption[];
    ranks: {minimum: NeutralOption[]; maximum: NeutralOption[]};
    defaultRankMin: string;
    regions: NeutralOption[];
    relativeMr: NeutralOption[];
    bucketSizes: string[];
    defaultBucketSize: string;
    gauges: {driveBars: number; superBars: number};
    resources: {actor: NeutralResourceOption[]; opponent: NeutralResourceOption[]};
}

export interface NeutralGaugeRange {
    min: number;
    max: number;
}

export interface NeutralSideGauges {
    drive: NeutralGaugeRange;
    super: NeutralGaugeRange;
    health: NeutralGaugeRange | null;
}

export type NeutralResourceSelection = Record<string, number[]>;

export type NeutralPatchMode = "all" | "latest";
export type NeutralStatsTab = "profiles" | "distribution";

export interface NeutralStatsFilterState {
    characterId: string | null;
    opponentId: string | null;
    regions: string[];
    rankMin: string;
    rankMax: string;
    relativeMr: string[];
    actor: NeutralSideGauges;
    opponent: NeutralSideGauges;
    actorResources: NeutralResourceSelection;
    opponentResources: NeutralResourceSelection;
    bucketSize: string;
    patch: NeutralPatchMode;
}

export interface NeutralMoveProfileCard {
    key: string;
    label: string;
    name: string | null;
    route: "raw" | "drive_rush";
    maxRange: number | null;
    total: number;
    counts: number[];
}

export type NeutralMoveFamily = "light" | "medium" | "heavy" | "drive_rush" | "special" | "misc" | "other";

export interface NeutralDistributionSeries {
    key: string;
    label: string;
    family: NeutralMoveFamily;
    isOd: boolean;
    total: number;
    share: number;
    values: number[];
}

export interface NeutralStatsResponse {
    character: {id: string; name: string};
    opponent: {id: string; name: string} | null;
    sample: {observationCount: number; replayCount: number; lowSample: boolean};
    spacing: {bucketSize: number; xMax: number; buckets: Array<{start: number; end: number}>};
    moveProfiles: {yMax: number; topLimit: number; cards: NeutralMoveProfileCard[]};
    distribution: {series: NeutralDistributionSeries[]};
}

export interface NeutralStatsImportResponse {
    replayCount: number;
    importedReplayCount: number;
    observationCount: number;
    importedObservationCount: number;
    skippedObservationCount: number;
    unmappedMoves: Array<{character: string; notation: string; actionId: number | null; moveName: string | null; count: number}>;
    warnings: string[];
    replays: Array<{replayId: string; importedCount: number; skippedCount: number; error?: string}>;
}
