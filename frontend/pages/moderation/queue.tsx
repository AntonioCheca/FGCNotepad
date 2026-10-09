import React from "react";
import AuthContext from "@/services/AuthContext";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {useModeration} from "@/hooks/useModeration";
import {ModerationQueueItem} from "@/src/types/moderation";
import {normalizeApiError} from "@/src/utils/apiErrorMessage";
import {ActionToast} from "@/src/components/ui/tactical/ActionToast";
import {ContentFilter, StateFilter, SortFilter, DecisionAction, toApiFilters, rowMatchesFilters} from "@/src/components/moderation/queue/moderationQueueFilters";
import {rowKey} from "@/src/components/moderation/queue/moderationQueueRows";
import {QueueFiltersCard} from "@/src/components/moderation/queue/QueueFiltersCard";
import {QueueSection} from "@/src/components/moderation/queue/QueueSection";

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
                const updatedRows: ModerationQueueItem[] = [];
                for (const row of current) {
                    const nextRow = rowKey(row) === key
                        ? {...row, state: response.moderationState}
                        : row;

                    if (rowMatchesFilters(nextRow, contentFilter, stateFilter)) {
                        updatedRows.push(nextRow);
                    }
                }

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
        <AppContainer maxWidth={false} sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3, xl: 4}}}>
            <PageShell
                title="Moderation Queue"
                badgeLabel={`Visible items: ${items.length}`}
            >
                <QueueFiltersCard
                    contentFilter={contentFilter}
                    stateFilter={stateFilter}
                    sortFilter={sortFilter}
                    loadingQueue={loadingQueue}
                    onContentFilterChange={setContentFilter}
                    onStateFilterChange={setStateFilter}
                    onSortFilterChange={setSortFilter}
                    onRefresh={() => void loadQueue()}
                />

                {queueError ? <InlineNotice severity="error">{queueError}</InlineNotice> : null}

                <QueueSection
                    items={items}
                    loadingQueue={loadingQueue}
                    activeReasonRowKey={activeReasonRowKey}
                    activeReasonAction={activeReasonAction}
                    reasonDraftByRowKey={reasonDraftByRowKey}
                    rowErrorByKey={rowErrorByKey}
                    pendingByKey={pendingByKey}
                    onDecision={runDecision}
                    onOpenReason={(key, action) => {
                        setActiveReasonRowKey(key);
                        setActiveReasonAction(action);
                        setRowErrorByKey((current) => ({...current, [key]: ""}));
                    }}
                    onCancelReason={() => {
                        setActiveReasonRowKey(null);
                        setActiveReasonAction(null);
                    }}
                    onReasonDraftChange={(key, value) => setReasonDraftByRowKey((current) => ({...current, [key]: value}))}
                />
            </PageShell>

            <ActionToast open={toastOpen} severity={toastSeverity} message={toastMessage} onClose={() => setToastOpen(false)} />
        </AppContainer>
    );
}
