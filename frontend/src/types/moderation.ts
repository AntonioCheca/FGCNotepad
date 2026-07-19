export type ModerationContentType = "combo" | "scenario";

export type ModerationState = "pending_review" | "approved" | "rejected" | "hidden";

export interface ModerationQueueItem {
    contentId: string;
    contentType: ModerationContentType;
    title: string;
    author: string;
    state: ModerationState;
    createdAt: string;
    updatedAt: string;
    flagCount: number;
}

export interface ModerationQueueMeta {
    total: number;
    filters: {
        contentType: ModerationContentType[];
        state: Array<ModerationState | "flagged">;
        sort: "oldest" | "newest";
    };
}

export interface ModerationQueueResponse {
    data: ModerationQueueItem[];
    meta: ModerationQueueMeta;
}

export interface ModerationDecisionResponse {
    contentType: ModerationContentType;
    contentId: string;
    moderationState: ModerationState;
    isPubliclyVisible: boolean;
    moderationDecidedAt: string | null;
    moderationDecidedBy: string | null;
    moderationReason: string | null;
}

export interface ModerationQueueFilters {
    contentType?: ModerationContentType[];
    state?: Array<ModerationState | "flagged">;
    sort?: "oldest" | "newest";
}
