import React from "react";
import Link from "next/link";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {InlineNotice} from "@/src/components/ui/tactical/InlineNotice";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppTableContainer} from "@/src/components/ui/AppTableContainer";
import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppTextField} from "@/src/components/ui/AppTextField";
import {formatUtcDateTime} from "@/src/utils/formatDateTime";
import {ModerationQueueItem} from "@/src/types/moderation";
import {DecisionAction} from "@/src/components/moderation/queue/moderationQueueFilters";
import {buildContentLink, rowKey} from "@/src/components/moderation/queue/moderationQueueRows";

const MOBILE_CARD_PAGE_SIZE = 20;

interface QueueSectionProps {
    items: ModerationQueueItem[];
    loadingQueue: boolean;
    activeReasonRowKey: string | null;
    activeReasonAction: "reject" | "hide" | null;
    reasonDraftByRowKey: Record<string, string>;
    rowErrorByKey: Record<string, string>;
    pendingByKey: Record<string, boolean>;
    onDecision: (item: ModerationQueueItem, action: DecisionAction) => Promise<void>;
    onOpenReason: (rowKey: string, action: "reject" | "hide") => void;
    onCancelReason: () => void;
    onReasonDraftChange: (rowKey: string, value: string) => void;
}

export function QueueSection({items, loadingQueue, activeReasonRowKey, activeReasonAction, reasonDraftByRowKey, rowErrorByKey, pendingByKey, onDecision, onOpenReason, onCancelReason, onReasonDraftChange}: QueueSectionProps) {
    const [visibleCardCount, setVisibleCardCount] = React.useState(MOBILE_CARD_PAGE_SIZE);
    const renderActions = (item: ModerationQueueItem, compact = false) => {
        const key = rowKey(item);
        const isPending = Boolean(pendingByKey[key]);
        const isReasonOpen = activeReasonRowKey === key && (activeReasonAction === "reject" || activeReasonAction === "hide");
        const reasonDraft = reasonDraftByRowKey[key] ?? "";
        const rowError = rowErrorByKey[key];

        return (
            <AppBox sx={{display: "grid", gap: 0.8}}>
                <AppBox sx={compact
                    ? {display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 0.6}
                    : {display: "flex", gap: 0.6, flexWrap: "wrap"}
                }>
                    <AppButton type="button" size="small" disabled={isPending} onClick={() => void onDecision(item, "approve")}>Approve</AppButton>
                    <AppButton type="button" size="small" variant="outlined" color="warning" disabled={isPending} onClick={() => onOpenReason(key, "reject")}>Reject</AppButton>
                    <AppButton type="button" size="small" variant="outlined" color="error" disabled={isPending} onClick={() => onOpenReason(key, "hide")}>Hide</AppButton>
                </AppBox>

                {isReasonOpen ? (
                    <AppBox sx={{display: "grid", gap: 0.65, p: 0.8, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1.2, backgroundColor: "fgc.surface.sunken"}}>
                        <AppTextField size="small" label={activeReasonAction === "reject" ? "Reject reason" : "Hide reason"} value={reasonDraft} onChange={(event) => onReasonDraftChange(key, event.target.value)} multiline minRows={2} placeholder="Required reason" />
                        <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(0, 1fr))"}, gap: 0.6, justifyContent: "flex-end"}}>
                            <AppButton type="button" size="small" variant="outlined" disabled={isPending} onClick={onCancelReason}>Cancel</AppButton>
                            <AppButton type="button" size="small" color={activeReasonAction === "hide" ? "error" : "warning"} disabled={isPending} onClick={() => void onDecision(item, activeReasonAction === "reject" ? "reject" : "hide")}>
                                {isPending ? "Submitting..." : (activeReasonAction === "reject" ? "Confirm Reject" : "Confirm Hide")}
                            </AppButton>
                        </AppBox>
                    </AppBox>
                ) : null}

                {rowError ? <AppTypography variant="caption" color="error">{rowError}</AppTypography> : null}
            </AppBox>
        );
    };

    return (
        <SectionCard title="Queue">
            {loadingQueue ? (
                <AppBox sx={{display: "flex", justifyContent: "center", py: 2}}><AppCircularProgress/></AppBox>
            ) : items.length === 0 ? (
                <InlineNotice severity="info">No items match the current moderation filters.</InlineNotice>
            ) : (
                <>
                <AppTableContainer sx={{display: {xs: "none", lg: "block"}, maxHeight: "calc(100dvh - 320px)", backgroundColor: "fgc.surface.base"}}>
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
                                return (
                                    <AppTableRow key={key} hover>
                                        <AppTableCell><AppChip size="small" label={item.contentType} variant="outlined"/></AppTableCell>
                                        <AppTableCell>
                                            <AppBox sx={{display: "grid", gap: 0.5}}>
                                                <AppTypography variant="body2" sx={{fontWeight: 600}}>{item.title || "Untitled"}</AppTypography>
                                                <Link href={buildContentLink(item)} style={{textDecoration: "none", width: "fit-content"}}><AppButton type="button" size="small" variant="outlined">Open</AppButton></Link>
                                            </AppBox>
                                        </AppTableCell>
                                        <AppTableCell>{item.author || "UNKNOWN_USER"}</AppTableCell>
                                        <AppTableCell>{item.state}</AppTableCell>
                                        <AppTableCell>{item.flagCount}</AppTableCell>
                                        <AppTableCell>{formatUtcDateTime(item.createdAt)}</AppTableCell>
                                        <AppTableCell>{formatUtcDateTime(item.updatedAt)}</AppTableCell>
                                        <AppTableCell sx={{minWidth: 280}}>
                                            {renderActions(item)}
                                        </AppTableCell>
                                    </AppTableRow>
                                );
                            })}
                        </AppTableBody>
                    </AppTable>
                </AppTableContainer>
                <AppBox sx={{display: {xs: "grid", lg: "none"}, gap: 1}}>
                    {items.slice(0, visibleCardCount).map((item) => {
                        const key = rowKey(item);
                        return (
                            <AppBox key={key} sx={{display: "grid", gap: 0.85, border: "1px solid", borderColor: "fgc.border.default", borderRadius: 1.25, p: 1.25, backgroundColor: "fgc.surface.subtle"}}>
                                <AppBox sx={{display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start"}}>
                                    <AppBox sx={{display: "grid", gap: 0.25, minWidth: 0}}>
                                        <Link href={buildContentLink(item)} style={{color: "inherit"}}>
                                            <AppTypography variant="body2" sx={{fontWeight: 650, overflowWrap: "anywhere", textDecoration: "underline", textUnderlineOffset: "2px"}}>{item.title || "Untitled"}</AppTypography>
                                        </Link>
                                        <AppTypography variant="caption" color="text.secondary">
                                            {item.author || "UNKNOWN_USER"} · {item.state} · {item.flagCount} flags · {formatUtcDateTime(item.updatedAt)}
                                        </AppTypography>
                                    </AppBox>
                                    <AppChip size="small" label={item.contentType} variant="outlined"/>
                                </AppBox>
                                {renderActions(item, true)}
                            </AppBox>
                        );
                    })}
                    {items.length > visibleCardCount ? (
                        <AppButton type="button" variant="outlined" onClick={() => setVisibleCardCount((count) => count + MOBILE_CARD_PAGE_SIZE)}>
                            Show more ({items.length - visibleCardCount} left)
                        </AppButton>
                    ) : null}
                </AppBox>
                </>
            )}
        </SectionCard>
    );
}
