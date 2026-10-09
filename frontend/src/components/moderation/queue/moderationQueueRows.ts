import {ModerationQueueItem} from "@/src/types/moderation";

export function buildContentLink(item: ModerationQueueItem): string {
    if (item.contentType === "combo") {
        return `/combos?highlightComboId=${item.contentId}`;
    }

    if (item.contentType === "oki") {
        return `/okis/${item.profileId}`;
    }

    return `/scenarios/${item.contentId}`;
}

export function rowKey(item: ModerationQueueItem): string {
    return `${item.contentType}:${item.contentId}`;
}
