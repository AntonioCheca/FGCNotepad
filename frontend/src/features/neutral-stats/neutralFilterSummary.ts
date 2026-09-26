import type {NeutralOption, NeutralStatsFilterState, NeutralStatsOptions} from "@/src/types/neutralStats";
import {NO_RANK_MIN} from "./neutralStatsQuery";

const labelFor = (options: NeutralOption[], value: string): string | null => options.find((option) => option.value === value)?.label ?? null;

export function rankBoundLabel(options: NeutralOption[], token: string): string {
    if (token.startsWith("mr:")) {
        return labelFor(options, token) ?? `${token.slice(3)} MR`;
    }

    return labelFor(options, token) ?? token;
}

export function rankRangeLabel(filters: NeutralStatsFilterState, options: NeutralStatsOptions): string {
    const min = filters.rankMin === NO_RANK_MIN ? null : filters.rankMin;
    const max = filters.rankMax === "" ? null : filters.rankMax;
    if (min === null && max === null) {
        return "All ranks";
    }
    if (max === null) {
        return min === null ? "All ranks" : minimumLabel(options, min);
    }
    const maxLabel = max.startsWith("mr:") ? `${max.slice(3)} MR` : rankBoundLabel(options.ranks.maximum, max);

    return min === null ? `Up to ${maxLabel}` : `${rankBoundLabel(options.ranks.minimum, min)} – ${maxLabel}`;
}

function minimumLabel(options: NeutralStatsOptions, min: string): string {
    if (min === "mr:0") {
        return "Master+";
    }

    return min.startsWith("mr:") ? `${min.slice(3)}+ MR` : `${rankBoundLabel(options.ranks.minimum, min)}+`;
}

export function filterSummary(filters: NeutralStatsFilterState, options: NeutralStatsOptions): string {
    const name = (id: string | null) => options.characters.find((character) => character.id === id)?.name;
    const parts = [
        `${name(filters.characterId) ?? ""} vs ${name(filters.opponentId) ?? "all"}`,
        rankRangeLabel(filters, options),
        filters.regions.length === 0 ? "All regions" : filters.regions.map((region) => labelFor(options.regions, region) ?? region).join(", "),
        `${filters.bucketSize} spacing`,
    ];
    if (filters.patch === "latest") {
        parts.push("Latest patch");
    }

    return parts.join(" · ");
}
