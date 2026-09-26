import type {
    NeutralGaugeRange,
    NeutralPatchMode,
    NeutralResourceSelection,
    NeutralSideGauges,
    NeutralStatsFilterState,
    NeutralStatsTab,
} from "../../types/neutralStats";

export const DEFAULT_RANK_MIN = "mr:1800";
export const NO_RANK_MIN = "any";
export const DEFAULT_BUCKET_SIZE = "0.25";
export const DRIVE_BARS = 6;
export const SUPER_BARS = 3;

type QueryValue = string | string[] | undefined;
export type NeutralQuery = Record<string, string>;

const fullRange = (max: number): NeutralGaugeRange => ({min: 0, max});

export const defaultSideGauges = (): NeutralSideGauges => ({
    drive: fullRange(DRIVE_BARS),
    super: fullRange(SUPER_BARS),
    health: null,
});

export const defaultFilterState = (): NeutralStatsFilterState => ({
    characterId: null,
    opponentId: null,
    regions: [],
    rankMin: DEFAULT_RANK_MIN,
    rankMax: "",
    relativeMr: [],
    actor: defaultSideGauges(),
    opponent: defaultSideGauges(),
    actorResources: {},
    opponentResources: {},
    bucketSize: DEFAULT_BUCKET_SIZE,
    patch: "all",
});

const first = (value: QueryValue): string => (Array.isArray(value) ? value[0] ?? "" : value ?? "").trim();
const list = (value: QueryValue): string[] => first(value).split(",").map((entry) => entry.trim()).filter(Boolean);

const numberOr = (value: QueryValue, fallback: number): number => {
    const text = first(value);
    const parsed = Number(text);

    return text !== "" && Number.isFinite(parsed) ? parsed : fallback;
};

function parseGauges(query: Record<string, QueryValue>, prefix: "" | "opp"): NeutralSideGauges {
    const key = (field: string) => (prefix === "" ? field.charAt(0).toLowerCase() + field.slice(1) : `${prefix}${field}`);
    const healthMin = first(query[key("HealthMin")]);
    const healthMax = first(query[key("HealthMax")]);

    return {
        drive: {min: numberOr(query[key("DriveMin")], 0), max: numberOr(query[key("DriveMax")], DRIVE_BARS)},
        super: {min: numberOr(query[key("SuperMin")], 0), max: numberOr(query[key("SuperMax")], SUPER_BARS)},
        health: healthMin === "" && healthMax === "" ? null : {min: numberOr(healthMin, 0), max: numberOr(healthMax, Number.MAX_SAFE_INTEGER)},
    };
}

function parseResources(query: Record<string, QueryValue>, prefix: "res" | "oppRes"): NeutralResourceSelection {
    const selection: NeutralResourceSelection = {};
    const pattern = new RegExp(`^${prefix}\\[([A-Za-z0-9_-]+)\\]$`);
    for (const [key, value] of Object.entries(query)) {
        const match = pattern.exec(key);
        const values = list(value).map(Number).filter((entry) => Number.isInteger(entry) && entry >= 0);
        if (match && values.length > 0) {
            selection[match[1]] = values;
        }
    }

    return selection;
}

export function parseNeutralQuery(query: Record<string, QueryValue>): {filters: NeutralStatsFilterState; tab: NeutralStatsTab} {
    const patch: NeutralPatchMode = first(query.patch) === "latest" ? "latest" : "all";

    return {
        filters: {
            characterId: first(query.character) || null,
            opponentId: first(query.opponent) || null,
            regions: list(query.region),
            rankMin: first(query.rankMin) || DEFAULT_RANK_MIN,
            rankMax: first(query.rankMax),
            relativeMr: list(query.relMr),
            actor: parseGauges(query, ""),
            opponent: parseGauges(query, "opp"),
            actorResources: parseResources(query, "res"),
            opponentResources: parseResources(query, "oppRes"),
            bucketSize: first(query.bucket) || DEFAULT_BUCKET_SIZE,
            patch,
        },
        tab: first(query.tab) === "distribution" ? "distribution" : "profiles",
    };
}

function serializeGauges(gauges: NeutralSideGauges, prefix: "" | "opp", query: NeutralQuery): void {
    const key = (field: string) => (prefix === "" ? field.charAt(0).toLowerCase() + field.slice(1) : `${prefix}${field}`);
    if (gauges.drive.min > 0) query[key("DriveMin")] = String(gauges.drive.min);
    if (gauges.drive.max < DRIVE_BARS) query[key("DriveMax")] = String(gauges.drive.max);
    if (gauges.super.min > 0) query[key("SuperMin")] = String(gauges.super.min);
    if (gauges.super.max < SUPER_BARS) query[key("SuperMax")] = String(gauges.super.max);
    if (gauges.health !== null) {
        if (gauges.health.min > 0) query[key("HealthMin")] = String(gauges.health.min);
        query[key("HealthMax")] = String(gauges.health.max);
    }
}

function serializeResources(selection: NeutralResourceSelection, prefix: "res" | "oppRes", query: NeutralQuery): void {
    for (const [key, values] of Object.entries(selection).sort(([left], [right]) => left.localeCompare(right))) {
        if (values.length > 0) {
            query[`${prefix}[${key}]`] = [...values].sort((left, right) => left - right).join(",");
        }
    }
}

/** Filter parameters shared by the page URL and the Symfony request. Defaults are left out. */
export function buildNeutralQuery(filters: NeutralStatsFilterState): NeutralQuery {
    const query: NeutralQuery = {};
    if (filters.characterId) query.character = filters.characterId;
    if (filters.opponentId) query.opponent = filters.opponentId;
    if (filters.regions.length > 0) query.region = filters.regions.join(",");
    if (filters.rankMin !== DEFAULT_RANK_MIN) query.rankMin = filters.rankMin;
    if (filters.rankMax) query.rankMax = filters.rankMax;
    if (filters.relativeMr.length > 0) query.relMr = filters.relativeMr.join(",");
    serializeGauges(filters.actor, "", query);
    serializeResources(filters.actorResources, "res", query);
    if (filters.opponentId) {
        serializeGauges(filters.opponent, "opp", query);
        serializeResources(filters.opponentResources, "oppRes", query);
    }
    if (filters.bucketSize !== DEFAULT_BUCKET_SIZE) query.bucket = filters.bucketSize;
    if (filters.patch !== "all") query.patch = filters.patch;

    return query;
}

export function buildNeutralUrlQuery(filters: NeutralStatsFilterState, tab: NeutralStatsTab): NeutralQuery {
    const query = buildNeutralQuery(filters);
    if (tab !== "profiles") query.tab = tab;

    return query;
}
