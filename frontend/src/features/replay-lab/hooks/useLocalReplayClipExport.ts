import React from "react";
import type {FFmpeg, LogEventCallback, ProgressEventCallback} from "@ffmpeg/ffmpeg";

import type {ReplayAnnotation, ReplayAnnotationExportResult, ReplayReviewSession} from "@/src/types/replayLab";
import {formatBytes, isMp4File} from "../replayReviewUtils";

export type LocalReplayExportStatus = "idle" | "loading" | "mounted" | "exporting" | "uploading" | "finalizing" | "done" | "failed";

const FFMPEG_CORE_BASE_URL = "/ffmpeg-core";
const FFMPEG_LOAD_TIMEOUT_MS = 120000;

interface UseLocalReplayClipExportOptions {
    saveReviewSession: (sessionId: string) => Promise<ReplayReviewSession>;
    uploadAnnotationClip: (annotationId: string, payload: {clip: Blob; durationMs: number}) => Promise<void>;
    exportReviewSession: (sessionId: string) => Promise<ReplayAnnotationExportResult>;
    listAnnotations: (sessionId: string) => Promise<ReplayAnnotation[]>;
}

interface RunLocalExportPayload {
    session: ReplayReviewSession;
    file: File | null;
    annotations: ReplayAnnotation[];
    onAnnotationsChange: (annotations: ReplayAnnotation[]) => void;
}

function getErrorMessage(error: unknown): string {
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

    return error instanceof Error ? error.message : "Replay export failed.";
}

function formatTimestamp(milliseconds: number): string {
    return `${(milliseconds / 1000).toFixed(3)}s`;
}

function extensionFor(file: File): string {
    const extension = file.name.split(".").pop()?.toLowerCase();
    return extension && /^[a-z0-9]+$/.test(extension) ? extension : "mp4";
}

function dataToBlob(data: Uint8Array | string): Blob {
    return new Blob([data], {type: "video/mp4"});
}

function ffmpegAssetUrl(path: string): string {
    return new URL(`${FFMPEG_CORE_BASE_URL}/${path}`, window.location.origin).toString();
}

function createFfmpegWorkerBlobUrl(): string {
    const source = `import ${JSON.stringify(ffmpegAssetUrl("worker.js"))};`;
    return URL.createObjectURL(new Blob([source], {type: "text/javascript"}));
}

async function verifyFfmpegAsset(path: string, onLog: (message: string) => void): Promise<void> {
    const url = ffmpegAssetUrl(path);
    const response = await fetch(url, {cache: "no-store"});
    const contentType = response.headers.get("content-type") ?? "unknown content type";
    onLog(`${path}: HTTP ${response.status}, ${contentType}.`);

    if (!response.ok) {
        throw new Error(`Unable to load ${path} from ${url}.`);
    }
}

async function loadWithTimeout(ffmpeg: FFmpeg, onLog: (message: string) => void): Promise<void> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FFMPEG_LOAD_TIMEOUT_MS);
    let workerBlobUrl: string | null = null;

    try {
        await Promise.all([
            verifyFfmpegAsset("worker.js", onLog),
            verifyFfmpegAsset("const.js", onLog),
            verifyFfmpegAsset("errors.js", onLog),
            verifyFfmpegAsset("ffmpeg-core.js", onLog),
            verifyFfmpegAsset("ffmpeg-core.wasm", onLog),
        ]);
        onLog("Starting ffmpeg worker and compiling wasm...");
        workerBlobUrl = createFfmpegWorkerBlobUrl();
        await ffmpeg.load({
            classWorkerURL: workerBlobUrl,
            coreURL: ffmpegAssetUrl("ffmpeg-core.js"),
            wasmURL: ffmpegAssetUrl("ffmpeg-core.wasm"),
        }, {signal: controller.signal});
    } catch (error: unknown) {
        if (controller.signal.aborted) {
            throw new Error("ffmpeg.wasm did not finish loading after 120 seconds. The assets were reachable, but the browser worker did not finish initializing the wasm runtime.");
        }
        if (typeof error === "string") {
            throw new Error(error);
        }
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
        if (workerBlobUrl) {
            URL.revokeObjectURL(workerBlobUrl);
        }
    }
}

function subscribeToFfmpegEvents(
    ffmpeg: FFmpeg,
    onLog: (message: string) => void,
    onProgress: (progress: number) => void,
): () => void {
    const logHandler: LogEventCallback = ({message}) => onLog(message);
    const progressHandler: ProgressEventCallback = ({progress: nextProgress}) => onProgress(Math.max(0, Math.min(1, nextProgress)));

    ffmpeg.on("log", logHandler);
    ffmpeg.on("progress", progressHandler);

    return () => {
        ffmpeg.off("log", logHandler);
        ffmpeg.off("progress", progressHandler);
    };
}

export function useLocalReplayClipExport({
    saveReviewSession,
    uploadAnnotationClip,
    exportReviewSession,
    listAnnotations,
}: UseLocalReplayClipExportOptions) {
    const ffmpegRef = React.useRef<FFmpeg | null>(null);
    const ffmpegEventCleanupRef = React.useRef<(() => void) | null>(null);
    const [status, setStatus] = React.useState<LocalReplayExportStatus>("idle");
    const [logs, setLogs] = React.useState<string[]>([]);
    const [progress, setProgress] = React.useState(0);
    const [result, setResult] = React.useState<ReplayAnnotationExportResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [isIsolated, setIsIsolated] = React.useState(false);

    React.useEffect(() => {
        setIsIsolated(window.crossOriginIsolated);
    }, []);

    React.useEffect(() => () => {
        const ffmpeg = ffmpegRef.current;
        if (!ffmpeg) {
            return;
        }

        ffmpegEventCleanupRef.current?.();
        ffmpeg.terminate();
        ffmpegRef.current = null;
        ffmpegEventCleanupRef.current = null;
    }, []);

    const appendLog = React.useCallback((message: string) => {
        setLogs((current) => [...current.slice(-120), message]);
    }, []);

    const loadFfmpeg = React.useCallback(async (): Promise<FFmpeg> => {
        if (ffmpegRef.current?.loaded) {
            return ffmpegRef.current;
        }
        setStatus("loading");
        appendLog("Loading ffmpeg.wasm...");
        const {FFmpeg: FFmpegClass} = await import("@ffmpeg/ffmpeg");
        const ffmpeg = new FFmpegClass();
        ffmpegEventCleanupRef.current?.();
        ffmpegEventCleanupRef.current = subscribeToFfmpegEvents(ffmpeg, appendLog, setProgress);
        try {
            await loadWithTimeout(ffmpeg, appendLog);
        } catch (error: unknown) {
            ffmpegEventCleanupRef.current?.();
            ffmpegEventCleanupRef.current = null;
            ffmpeg.terminate();
            throw error;
        }
        ffmpegRef.current = ffmpeg;
        appendLog("ffmpeg.wasm loaded.");
        return ffmpeg;
    }, [appendLog]);

    const runExport = React.useCallback(async ({session, file, annotations, onAnnotationsChange}: RunLocalExportPayload) => {
        if (!file) {
            setError("Choose the local original replay file first.");
            return null;
        }
        if (!isMp4File(file)) {
            setError("Only MP4 files are supported. Convert MKV files to MP4 before export.");
            return null;
        }

        const pendingAnnotations = annotations.filter((annotation) => !annotation.exportedClip);
        if (pendingAnnotations.length === 0) {
            setError("This session has no unexported annotations.");
            return null;
        }

        setError(null);
        setResult(null);
        setLogs([]);
        setProgress(0);

        try {
            await saveReviewSession(session.id);
            const [{FFFSType}, ffmpeg] = await Promise.all([import("@ffmpeg/ffmpeg"), loadFfmpeg()]);
            const mountPoint = "/input";
            const inputPath = `${mountPoint}/source.${extensionFor(file)}`;
            setStatus("mounted");
            appendLog(`Mounting ${file.name} (${formatBytes(file.size)}) through WORKERFS...`);
            await ffmpeg.createDir(mountPoint).catch(() => true);
            await ffmpeg.mount(FFFSType.WORKERFS, {files: [new File([file], inputPath.split("/").pop() ?? "source.mp4", {type: file.type})]}, mountPoint);

            for (const annotation of pendingAnnotations) {
                setStatus("exporting");
                setProgress(0);
                const outputName = `${annotation.id}.mp4`;
                const startSeconds = annotation.startTimeMs / 1000;
                const durationSeconds = (annotation.endTimeMs - annotation.startTimeMs) / 1000;
                appendLog(`Generating clip: ${formatTimestamp(annotation.startTimeMs)} - ${formatTimestamp(annotation.endTimeMs)}.`);
                const exitCode = await ffmpeg.exec([
                    "-ss", String(startSeconds),
                    "-i", inputPath,
                    "-t", String(durationSeconds),
                    "-c", "copy",
                    "-avoid_negative_ts", "make_zero",
                    "-movflags", "+faststart",
                    outputName,
                ], 600000);
                if (exitCode !== 0) {
                    throw new Error(`ffmpeg failed for annotation ${annotation.id} with exit code ${exitCode}.`);
                }
                const outputData = await ffmpeg.readFile(outputName);
                const blob = dataToBlob(outputData);
                setStatus("uploading");
                appendLog(`Uploading clip (${formatBytes(blob.size)}, ${blob.type || "unknown type"}).`);
                await uploadAnnotationClip(annotation.id, {clip: blob, durationMs: annotation.endTimeMs - annotation.startTimeMs});
                await ffmpeg.deleteFile(outputName).catch(() => true);
            }

            setStatus("finalizing");
            appendLog("Creating practice tasks and study cards from uploaded clips...");
            const exportResult = await exportReviewSession(session.id);
            setResult(exportResult);
            onAnnotationsChange(await listAnnotations(session.id));
            setStatus("done");
            appendLog("Export complete.");
            await ffmpeg.unmount(mountPoint).catch(() => true);
            return exportResult;
        } catch (caughtError: unknown) {
            appendLog(getErrorMessage(caughtError));
            setStatus("failed");
            setError(getErrorMessage(caughtError));
            return null;
        }
    }, [appendLog, exportReviewSession, listAnnotations, loadFfmpeg, saveReviewSession, uploadAnnotationClip]);

    const busy = ["loading", "mounted", "exporting", "uploading", "finalizing"].includes(status);

    return {
        status,
        logs,
        progress,
        result,
        error,
        isIsolated,
        busy,
        setError,
        runExport,
    };
}
