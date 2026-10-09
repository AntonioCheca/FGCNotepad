import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppButton} from "@/src/components/ui/AppButton";
import {ContentFilter, StateFilter, SortFilter, CONTENT_FILTER_OPTIONS, STATE_FILTER_OPTIONS, SORT_FILTER_OPTIONS} from "@/src/components/moderation/queue/moderationQueueFilters";

interface QueueFiltersCardProps {
    contentFilter: ContentFilter;
    stateFilter: StateFilter;
    sortFilter: SortFilter;
    loadingQueue: boolean;
    onContentFilterChange: (value: ContentFilter) => void;
    onStateFilterChange: (value: StateFilter) => void;
    onSortFilterChange: (value: SortFilter) => void;
    onRefresh: () => void;
}

export function QueueFiltersCard({contentFilter, stateFilter, sortFilter, loadingQueue, onContentFilterChange, onStateFilterChange, onSortFilterChange, onRefresh}: QueueFiltersCardProps) {
    return (
        <SectionCard title="Queue Filters" tone="raised">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "repeat(4, minmax(0, 1fr))"}, gap: 1.1}}>
                <AppFormControl size="small" fullWidth>
                    <AppInputLabel id="moderation-content-filter-label">Content Type</AppInputLabel>
                    <AppSelect labelId="moderation-content-filter-label" label="Content Type" value={contentFilter} onChange={(event) => onContentFilterChange(event.target.value as ContentFilter)}>
                        {CONTENT_FILTER_OPTIONS.map((option) => <AppMenuItem key={option.value} value={option.value}>{option.label}</AppMenuItem>)}
                    </AppSelect>
                </AppFormControl>

                <AppFormControl size="small" fullWidth>
                    <AppInputLabel id="moderation-state-filter-label">State</AppInputLabel>
                    <AppSelect labelId="moderation-state-filter-label" label="State" value={stateFilter} onChange={(event) => onStateFilterChange(event.target.value as StateFilter)}>
                        {STATE_FILTER_OPTIONS.map((option) => <AppMenuItem key={option.value} value={option.value}>{option.label}</AppMenuItem>)}
                    </AppSelect>
                </AppFormControl>

                <AppFormControl size="small" fullWidth>
                    <AppInputLabel id="moderation-sort-filter-label">Sort</AppInputLabel>
                    <AppSelect labelId="moderation-sort-filter-label" label="Sort" value={sortFilter} onChange={(event) => onSortFilterChange(event.target.value as SortFilter)}>
                        {SORT_FILTER_OPTIONS.map((option) => <AppMenuItem key={option.value} value={option.value}>{option.label}</AppMenuItem>)}
                    </AppSelect>
                </AppFormControl>

                <AppBox sx={{display: "flex", alignItems: "center", justifyContent: {xs: "stretch", md: "flex-end"}}}>
                    <AppButton type="button" variant="outlined" onClick={onRefresh} disabled={loadingQueue} sx={{width: {xs: "100%", md: "auto"}}}>{loadingQueue ? "Refreshing..." : "Refresh Queue"}</AppButton>
                </AppBox>
            </AppBox>
        </SectionCard>
    );
}
