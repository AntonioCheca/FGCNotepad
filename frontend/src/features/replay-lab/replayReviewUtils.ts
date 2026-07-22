import {
    replayMemoryCategories,
    replayTaskCategories,
    type ReplayAnnotationCategory,
    type ReplayAnnotationEventKind,
    type ReplayVideo,
} from "@/src/types/replayLab";

export type WorkflowMode = "local" | "coaching";

export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);

    return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function getReplayLabErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as {response?: {data?: {error?: unknown; message?: unknown}; status?: number}}).response;
        if (typeof response?.data?.error === "string") {
            return response.data.error;
        }
        if (typeof response?.data?.message === "string") {
            return response.data.message;
        }
        if (typeof response?.status === "number") {
            return `Request failed with status ${response.status}.`;
        }
    }

    return error instanceof Error ? error.message : "Replay Lab request failed.";
}

export function formatTimestamp(milliseconds: number): string {
    return `${(milliseconds / 1000).toFixed(3)}s`;
}

export function isMp4File(file: File): boolean {
    return file.name.toLowerCase().endsWith(".mp4") || file.type === "video/mp4";
}

export function humanizeCategory(category: string): string {
    return category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function categoriesFor(eventKind: ReplayAnnotationEventKind): readonly ReplayAnnotationCategory[] {
    return eventKind === "memory" ? replayMemoryCategories : replayTaskCategories;
}

export function defaultCategory(eventKind: ReplayAnnotationEventKind): ReplayAnnotationCategory {
    return categoriesFor(eventKind)[0];
}

export function workflowForVideo(video: ReplayVideo | null): WorkflowMode | null {
    if (!video) {
        return null;
    }

    return video.sourceType === "youtube" ? "coaching" : "local";
}

export function shouldIgnoreReplayShortcut(event: KeyboardEvent): boolean {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

export function rememberReplayExportSource(sessionId: string, file: File): void {
    window.sessionStorage.setItem(`replayLab.export.${sessionId}`, JSON.stringify({filename: file.name, sizeBytes: file.size}));
}
