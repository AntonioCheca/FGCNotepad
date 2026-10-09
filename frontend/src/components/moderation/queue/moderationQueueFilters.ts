import {ModerationContentType, ModerationQueueFilters, ModerationQueueItem, ModerationState} from "@/src/types/moderation";

export type ContentFilter = "all" | ModerationContentType;

export type StateFilter = "review_needed" | ModerationState | "flagged";

export type SortFilter = "oldest" | "newest";

export type DecisionAction = "approve" | "reject" | "hide";

export const CONTENT_FILTER_OPTIONS: Array<{value: ContentFilter; label: string}> = [
    {value: "all", label: "All Content"},
    {value: "combo", label: "Combos"},
    {value: "scenario", label: "Scenarios"},
    {value: "oki", label: "Okis"},
];

export const STATE_FILTER_OPTIONS: Array<{value: StateFilter; label: string}> = [
    {value: "review_needed", label: "Review Needed"},
    {value: "pending_review", label: "Pending Review"},
    {value: "flagged", label: "Flagged"},
    {value: "approved", label: "Approved"},
    {value: "rejected", label: "Rejected"},
    {value: "hidden", label: "Hidden"},
];

export const SORT_FILTER_OPTIONS: Array<{value: SortFilter; label: string}> = [
    {value: "oldest", label: "Oldest First"},
    {value: "newest", label: "Newest First"},
];

export function toApiFilters(contentType: ContentFilter, state: StateFilter, sort: SortFilter): ModerationQueueFilters {
    return {
        contentType: contentType === "all" ? undefined : [contentType],
        state: state === "review_needed" ? ["pending_review", "flagged"] : [state],
        sort,
    };
}

export function rowMatchesFilters(item: ModerationQueueItem, contentFilter: ContentFilter, stateFilter: StateFilter): boolean {
    if (contentFilter !== "all" && item.contentType !== contentFilter) {
        return false;
    }

    if (stateFilter === "review_needed") {
        return item.state === "pending_review" || item.flagCount > 0;
    }

    if (stateFilter === "flagged") {
        return item.flagCount > 0;
    }

    return item.state === stateFilter;
}
