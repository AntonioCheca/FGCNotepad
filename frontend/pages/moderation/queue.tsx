import React from "react";
import Link from "next/link";
import AuthContext from "@/services/AuthContext";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppFormControl} from "@/src/components/ui/AppFormControl";
import {AppInputLabel} from "@/src/components/ui/AppInputLabel";
import {AppSelect} from "@/src/components/ui/AppSelect";
import {AppMenuItem} from "@/src/components/ui/AppMenuItem";
import {AppTableContainer} from "@/src/components/ui/AppTableContainer";
import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppSnackbar} from "@/src/components/ui/AppSnackbar";
import {useModeration} from "@/hooks/useModeration";
import {
    ModerationContentType,
    ModerationQueueFilters,
    ModerationQueueItem,
    ModerationState,
} from "@/src/types/moderation";

type ContentFilter = "all" | ModerationContentType;
type StateFilter = "review_needed" | ModerationState | "flagged";
type SortFilter = "oldest" | "newest";
type DecisionAction = "approve" | "reject" | "hide";

const CONTENT_FILTER_OPTIONS: Array<{value: ContentFilter; label: string}> = [
    {value: "all", label: "All Content"},
    {value: "combo", label: "Combos"},
    {value: "scenario", label: "Scenarios"},
];

const STATE_FILTER_OPTIONS: Array<{value: StateFilter; label: string}> = [
    {value: "review_needed", label: "Review Needed"},
    {value: "pending_review", label: "Pending Review"},
    {value: "flagged", label: "Flagged"},
    {value: "approved", label: "Approved"},
    {value: "rejected", label: "Rejected"},
    {value: "hidden", label: "Hidden"},
];

const SORT_FILTER_OPTIONS: Array<{value: SortFilter; label: string}> = [
    {value: "oldest", label: "Oldest First"},
    {value: "newest", label: "Newest First"},
];

function toApiFilters(contentType: ContentFilter, state: StateFilter, sort: SortFilter): ModerationQueueFilters {
    return {
        contentType: contentType === "all" ? undefined : [contentType],
        state: state === "review_needed" ? ["pending_review", "flagged"] : [state],
        sort,
    };
}

function buildContentLink(item: ModerationQueueItem): string {
    if (item.contentType === "combo") {
        return `/combos?highlightComboId=${item.contentId}`;
    }

    return `/scenarios/${item.contentId}`;
}

function rowKey(item: ModerationQueueItem): string {
    return `${item.contentType}:${item.contentId}`;
}

function formatDate(value: string): string {
    if (!value) {
        return "-";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }

    return parsed.toLocaleString();
}

function normalizeApiError(error: unknown, fallbackMessage: string): string {
    if (typeof error !== "object" || error === null) {
        return fallbackMessage;
    }

    const maybeResponse = error as {
        response?: {
            data?: {error?: string; message?: string};
        };
        message?: string;
    };

    return maybeResponse.response?.data?.error
        || maybeResponse.response?.data?.message
        || maybeResponse.message
        || fallbackMessage;
}

function rowMatchesFilters(item: ModerationQueueItem, contentFilter: ContentFilter, stateFilter: StateFilter): boolean {
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

export default function ModerationQueuePage() {
    const authContext = React.useContext(AuthContext);
    const {getQueue, approve, reject, hide} = useModeration();

    const [contentFilter, setContentFilter] = React.useState<ContentFilter>("all");
    const [stateFilter, setStateFilter] = React.useState<StateFilter>("review_needed");
    const [sortFilter, setSortFilter] = React.useState<SortFilter>("oldest");

    const [items, setItems] = React.useState<ModerationQueueItem[]>([]);
    const [loadingQueue, setLoadingQueue] = React.useState<boolean>(true);
    const [queueError, setQueueError] = React.useState<string | null>(null);

    const [activeReasonRowKey, setActiveReasonRowKey] = React.useState<string | null>(null);
    const [activeReasonAction, setActiveReasonAction] = React.useState<"reject" | "hide" | null>(null);
    const [reasonDraftByRowKey, setReasonDraftByRowKey] = React.useState<Record<string, string>>({});
    const [rowErrorByKey, setRowErrorByKey] = React.useState<Record<string, string>>({});
    const [pendingByKey, setPendingByKey] = React.useState<Record<string, boolean>>({});

    const [toastOpen, setToastOpen] = React.useState(false);
    const [toastSeverity, setToastSeverity] = React.useState<"success" | "error">("success");
    const [toastMessage, setToastMessage] = React.useState("");

    if (!authContext) {
        throw new Error("AuthContext must be used within an AuthProvider");
    }

    const {loading, isAuthenticated, canModerate} = authContext;

    const loadQueue = React.useCallback(async () => {
        setLoadingQueue(true);
        setQueueError(null);

        try {
            const payload = await getQueue(toApiFilters(contentFilter, stateFilter, sortFilter));
            setItems(payload.data ?? []);
        } catch (error: unknown) {
            setQueueError(normalizeApiError(error, "Unable to load moderation queue."));
        } finally {
            setLoadingQueue(false);
        }
    }, [contentFilter, getQueue, sortFilter, stateFilter]);

    React.useEffect(() => {
        if (loading || !isAuthenticated || !canModerate) {
            return;
        }

        void loadQueue();
    }, [canModerate, isAuthenticated, loadQueue, loading]);

    const showToast = (severity: "success" | "error", message: string) => {
        setToastSeverity(severity);
        setToastMessage(message);
        setToastOpen(true);
    };

    const runDecision = async (item: ModerationQueueItem, action: DecisionAction): Promise<void> => {
        const key = rowKey(item);

        setRowErrorByKey((current) => ({...current, [key]: ""}));
        setPendingByKey((current) => ({...current, [key]: true}));

        try {
            let reason: string | undefined;
            if (action === "reject" || action === "hide") {
                reason = (reasonDraftByRowKey[key] ?? "").trim();
                if (!reason) {
                    setRowErrorByKey((current) => ({...current, [key]: "Reason is required for reject/hide."}));
                    return;
                }
            }

            const response = action === "approve"
                ? await approve(item.contentType, item.contentId)
                : action === "reject"
                    ? await reject(item.contentType, item.contentId, reason ?? "")
                    : await hide(item.contentType, item.contentId, reason ?? "");

            setItems((current) => {
                const updatedRows = current
                    .map((row) => {
                        if (rowKey(row) !== key) {
                            return row;
                        }

                        return {
                            ...row,
                            state: response.moderationState,
                        };
                    })
                    .filter((row) => rowMatchesFilters(row, contentFilter, stateFilter));

                return updatedRows;
            });

            setReasonDraftByRowKey((current) => ({...current, [key]: ""}));
            setActiveReasonAction(null);
            setActiveReasonRowKey(null);
            showToast("success", `${item.contentType} ${action}d successfully.`);
        } catch (error: unknown) {
            const message = normalizeApiError(error, `Unable to ${action} this item.`);
            setRowErrorByKey((current) => ({...current, [key]: message}));
            showToast("error", message);

            const status = typeof error === "object" && error !== null
                && "response" in error
                && typeof (error as {response?: {status?: number}}).response?.status === "number"
                ? (error as {response: {status: number}}).response.status
                : null;

            if (status === 404 || status === 409) {
                void loadQueue();
            }
        } finally {
            setPendingByKey((current) => ({...current, [key]: false}));
        }
    };

    if (loading) {
        return (
            <AppContainer maxWidth={false}>
                <AppCircularProgress/>
            </AppContainer>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (!canModerate) {
        return (
            <AppContainer maxWidth={false}>
                <AppTypography variant="h4" gutterBottom>Moderation Queue</AppTypography>
                <AppTypography>You do not have permission to access moderation tools.</AppTypography>
            </AppContainer>
        );
    }

    return (
        <AppContainer maxWidth={false}>
            <PageShell
                title="Moderation Queue"
                subtitle="Process pending and flagged content quickly. Decisions apply immediately and keep the queue synchronized."
                badgeLabel={`Visible items: ${items.length}`}
            >
                <SectionCard
                    title="Queue Filters"
                    description="Narrow by content type, moderation state, and ordering."
                    variant="review"
                    tone="raised"
                >
                    <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "repeat(4, minmax(0, 1fr))"}, gap: 1.1}}>
                        <AppFormControl size="small" fullWidth>
                            <AppInputLabel id="moderation-content-filter-label">Content Type</AppInputLabel>
                            <AppSelect
                                labelId="moderation-content-filter-label"
                                label="Content Type"
                                value={contentFilter}
                                onChange={(event) => setContentFilter(event.target.value as ContentFilter)}
                            >
                                {CONTENT_FILTER_OPTIONS.map((option) => (
                                    <AppMenuItem key={option.value} value={option.value}>{option.label}</AppMenuItem>
                                ))}
                            </AppSelect>
                        </AppFormControl>

                        <AppFormControl size="small" fullWidth>
                            <AppInputLabel id="moderation-state-filter-label">State</AppInputLabel>
                            <AppSelect
                                labelId="moderation-state-filter-label"
                                label="State"
                                value={stateFilter}
                                onChange={(event) => setStateFilter(event.target.value as StateFilter)}
                            >
                                {STATE_FILTER_OPTIONS.map((option) => (
                                    <AppMenuItem key={option.value} value={option.value}>{option.label}</AppMenuItem>
                                ))}
                            </AppSelect>
                        </AppFormControl>

                        <AppFormControl size="small" fullWidth>
                            <AppInputLabel id="moderation-sort-filter-label">Sort</AppInputLabel>
                            <AppSelect
                                labelId="moderation-sort-filter-label"
                                label="Sort"
                                value={sortFilter}
                                onChange={(event) => setSortFilter(event.target.value as SortFilter)}
                            >
                                {SORT_FILTER_OPTIONS.map((option) => (
                                    <AppMenuItem key={option.value} value={option.value}>{option.label}</AppMenuItem>
                                ))}
                            </AppSelect>
                        </AppFormControl>

                        <AppBox sx={{display: "flex", alignItems: "center", justifyContent: {xs: "flex-start", md: "flex-end"}}}>
                            <AppButton type="button" variant="outlined" onClick={() => void loadQueue()} disabled={loadingQueue}>
                                {loadingQueue ? "Refreshing..." : "Refresh Queue"}
                            </AppButton>
                        </AppBox>
                    </AppBox>
                </SectionCard>

                {queueError ? <InlineNotice severity="error">{queueError}</InlineNotice> : null}

                <SectionCard
                    title="Queue"
                    description="Approve to publish, reject/hide with a reason to keep moderation audit clarity."
                    variant="review"
                >
                    {loadingQueue ? (
                        <AppBox sx={{display: "flex", justifyContent: "center", py: 2}}>
                            <AppCircularProgress/>
                        </AppBox>
                    ) : items.length === 0 ? (
                        <InlineNotice severity="info">No items match the current moderation filters.</InlineNotice>
                    ) : (
                        <AppTableContainer sx={{maxHeight: "calc(100vh - 320px)", backgroundColor: "fgc.surface.base"}}>
                            <AppTable stickyHeader size="small">
                                <AppTableHead>
                                    <AppTableRow>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Type</AppTableCell>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Title</AppTableCell>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Author</AppTableCell>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>State</AppTableCell>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Flags</AppTableCell>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Created</AppTableCell>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Updated</AppTableCell>
                                        <AppTableCell sx={{fontWeight: 700, backgroundColor: "fgc.surface.sunken"}}>Actions</AppTableCell>
                                    </AppTableRow>
                                </AppTableHead>

                                <AppTableBody>
                                    {items.map((item) => {
                                        const key = rowKey(item);
                                        const isPending = Boolean(pendingByKey[key]);
                                        const isReasonOpen = activeReasonRowKey === key && (activeReasonAction === "reject" || activeReasonAction === "hide");
                                        const reasonDraft = reasonDraftByRowKey[key] ?? "";
                                        const rowError = rowErrorByKey[key];

                                        return (
                                            <AppTableRow key={key} hover>
                                                <AppTableCell>
                                                    <AppChip size="small" label={item.contentType} variant="outlined"/>
                                                </AppTableCell>
                                                <AppTableCell>
                                                    <AppBox sx={{display: "grid", gap: 0.5}}>
                                                        <AppTypography variant="body2" sx={{fontWeight: 600}}>{item.title || "Untitled"}</AppTypography>
                                                        <Link href={buildContentLink(item)} style={{textDecoration: "none", width: "fit-content"}}>
                                                            <AppButton type="button" size="small" variant="outlined">Open</AppButton>
                                                        </Link>
                                                    </AppBox>
                                                </AppTableCell>
                                                <AppTableCell>{item.author || "UNKNOWN_USER"}</AppTableCell>
                                                <AppTableCell>{item.state}</AppTableCell>
                                                <AppTableCell>{item.flagCount}</AppTableCell>
                                                <AppTableCell>{formatDate(item.createdAt)}</AppTableCell>
                                                <AppTableCell>{formatDate(item.updatedAt)}</AppTableCell>
                                                <AppTableCell sx={{minWidth: 280}}>
                                                    <AppBox sx={{display: "grid", gap: 0.8}}>
                                                        <AppBox sx={{display: "flex", gap: 0.6, flexWrap: "wrap"}}>
                                                            <AppButton
                                                                type="button"
                                                                size="small"
                                                                disabled={isPending}
                                                                onClick={() => void runDecision(item, "approve")}
                                                            >
                                                                Approve
                                                            </AppButton>
                                                            <AppButton
                                                                type="button"
                                                                size="small"
                                                                variant="outlined"
                                                                color="warning"
                                                                disabled={isPending}
                                                                onClick={() => {
                                                                    setActiveReasonRowKey(key);
                                                                    setActiveReasonAction("reject");
                                                                    setRowErrorByKey((current) => ({...current, [key]: ""}));
                                                                }}
                                                            >
                                                                Reject
                                                            </AppButton>
                                                            <AppButton
                                                                type="button"
                                                                size="small"
                                                                variant="outlined"
                                                                color="error"
                                                                disabled={isPending}
                                                                onClick={() => {
                                                                    setActiveReasonRowKey(key);
                                                                    setActiveReasonAction("hide");
                                                                    setRowErrorByKey((current) => ({...current, [key]: ""}));
                                                                }}
                                                            >
                                                                Hide
                                                            </AppButton>
                                                        </AppBox>

                                                        {isReasonOpen ? (
                                                            <AppBox sx={{display: "grid", gap: 0.65, p: 0.8, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1.2, backgroundColor: "fgc.surface.sunken"}}>
                                                                <AppTextField
                                                                    size="small"
                                                                    label={activeReasonAction === "reject" ? "Reject reason" : "Hide reason"}
                                                                    value={reasonDraft}
                                                                    onChange={(event) => {
                                                                        const value = event.target.value;
                                                                        setReasonDraftByRowKey((current) => ({...current, [key]: value}));
                                                                    }}
                                                                    multiline
                                                                    minRows={2}
                                                                    placeholder="Required reason"
                                                                />
                                                                <AppBox sx={{display: "flex", gap: 0.6, justifyContent: "flex-end"}}>
                                                                    <AppButton
                                                                        type="button"
                                                                        size="small"
                                                                        variant="outlined"
                                                                        disabled={isPending}
                                                                        onClick={() => {
                                                                            setActiveReasonRowKey(null);
                                                                            setActiveReasonAction(null);
                                                                        }}
                                                                    >
                                                                        Cancel
                                                                    </AppButton>
                                                                    <AppButton
                                                                        type="button"
                                                                        size="small"
                                                                        color={activeReasonAction === "hide" ? "error" : "warning"}
                                                                        disabled={isPending}
                                                                        onClick={() => {
                                                                            if (activeReasonAction === "reject") {
                                                                                void runDecision(item, "reject");
                                                                                return;
                                                                            }

                                                                            void runDecision(item, "hide");
                                                                        }}
                                                                    >
                                                                        {isPending ? "Submitting..." : (activeReasonAction === "reject" ? "Confirm Reject" : "Confirm Hide")}
                                                                    </AppButton>
                                                                </AppBox>
                                                            </AppBox>
                                                        ) : null}

                                                        {rowError ? <AppTypography variant="caption" color="error">{rowError}</AppTypography> : null}
                                                    </AppBox>
                                                </AppTableCell>
                                            </AppTableRow>
                                        );
                                    })}
                                </AppTableBody>
                            </AppTable>
                        </AppTableContainer>
                    )}
                </SectionCard>
            </PageShell>

            <AppSnackbar
                open={toastOpen}
                autoHideDuration={3000}
                onClose={() => setToastOpen(false)}
                anchorOrigin={{vertical: "bottom", horizontal: "right"}}
            >
                <AppAlert
                    severity={toastSeverity}
                    variant="filled"
                    onClose={() => setToastOpen(false)}
                    sx={{width: "100%"}}
                >
                    {toastMessage}
                </AppAlert>
            </AppSnackbar>
        </AppContainer>
    );
}
