import React from "react";
import {useRouter} from "next/router";
import type {FFmpeg, LogEventCallback, ProgressEventCallback} from "@ffmpeg/ffmpeg";
import {useReplayLab} from "@/hooks/useReplayLab";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import type {ReplayAnnotation, ReplayAnnotationExportResult, ReplayReviewSession} from "@/src/types/replayLab";

type ExportStatus = "idle" | "loading" | "mounted" | "exporting" | "uploading" | "finalizing" | "done" | "failed";

function getErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as {response?: {data?: {message?: unknown}; status?: number}}).response;
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

function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 B";
    }
    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function extensionFor(file: File): string {
    const extension = file.name.split(".").pop()?.toLowerCase();
    return extension && /^[a-z0-9]+$/.test(extension) ? extension : "mp4";
}

function isMp4File(file: File): boolean {
    return file.name.toLowerCase().endsWith(".mp4") || file.type === "video/mp4";
}

function dataToBlob(data: Uint8Array | string): Blob {
    return new Blob([data], {type: "video/mp4"});
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

export default function ReplayLabExportRoute() {
    const router = useRouter();
    const sessionId = typeof router.query.sessionId === "string" ? router.query.sessionId : null;
    const {getReviewSession, listAnnotations, uploadAnnotationClip, exportReviewSession} = useReplayLab();
    const ffmpegRef = React.useRef<FFmpeg | null>(null);
    const ffmpegEventCleanupRef = React.useRef<(() => void) | null>(null);
    const [session, setSession] = React.useState<ReplayReviewSession | null>(null);
    const [annotations, setAnnotations] = React.useState<ReplayAnnotation[]>([]);
    const [file, setFile] = React.useState<File | null>(null);
    const [expectedFile, setExpectedFile] = React.useState<{filename: string; sizeBytes: number} | null>(null);
    const [status, setStatus] = React.useState<ExportStatus>("idle");
    const [logs, setLogs] = React.useState<string[]>([]);
    const [progress, setProgress] = React.useState(0);
    const [result, setResult] = React.useState<ReplayAnnotationExportResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [isIsolated, setIsIsolated] = React.useState(false);

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

    React.useEffect(() => {
        setIsIsolated(window.crossOriginIsolated);
    }, []);

    React.useEffect(() => {
        if (!sessionId) {
            return;
        }
        const storedExpectedFile = window.sessionStorage.getItem(`replayLab.export.${sessionId}`);
        if (storedExpectedFile) {
            try {
                const parsed = JSON.parse(storedExpectedFile) as {filename?: unknown; sizeBytes?: unknown};
                if (typeof parsed.filename === "string" && typeof parsed.sizeBytes === "number") {
                    setExpectedFile({filename: parsed.filename, sizeBytes: parsed.sizeBytes});
                }
            } catch {
                setExpectedFile(null);
            }
        }
        void Promise.all([getReviewSession(sessionId), listAnnotations(sessionId)])
            .then(([nextSession, nextAnnotations]) => {
                setSession(nextSession);
                setAnnotations(nextAnnotations);
            })
            .catch((caughtError: unknown) => setError(getErrorMessage(caughtError)));
    }, [getReviewSession, listAnnotations, sessionId]);

    const appendLog = React.useCallback((message: string) => {
        setLogs((current) => [...current.slice(-120), message]);
    }, []);

    const loadFfmpeg = async (): Promise<FFmpeg> => {
        if (ffmpegRef.current?.loaded) {
            return ffmpegRef.current;
        }
        setStatus("loading");
        appendLog("Loading ffmpeg.wasm...");
        const {FFmpeg: FFmpegClass} = await import("@ffmpeg/ffmpeg");
        const ffmpeg = new FFmpegClass();
        ffmpegEventCleanupRef.current?.();
        ffmpegEventCleanupRef.current = subscribeToFfmpegEvents(ffmpeg, appendLog, setProgress);
        await ffmpeg.load();
        ffmpegRef.current = ffmpeg;
        appendLog("ffmpeg.wasm loaded.");
        return ffmpeg;
    };

    const runExport = async () => {
        if (!sessionId || !session) {
            setError("Open this page from an active Replay Lab session.");
            return;
        }
        if (!file) {
            setError("Choose the local original replay file first.");
            return;
        }
        if (!isMp4File(file)) {
            setError("Only MP4 files are supported. Convert MKV files to MP4 before export.");
            return;
        }

        const pendingAnnotations = annotations.filter((annotation) => !annotation.exportedClip);
        if (pendingAnnotations.length === 0) {
            setError("This session has no unexported annotations.");
            return;
        }

        setError(null);
        setResult(null);
        setLogs([]);
        setProgress(0);
        try {
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
                    "-map", "0:v:0",
                    "-map", "0:a?",
                    "-c:v", "libx264",
                    "-preset", "veryfast",
                    "-crf", "20",
                    "-c:a", "aac",
                    "-movflags", "+faststart",
                    outputName,
                ], 600000);
                if (exitCode !== 0) {
                    throw new Error(`ffmpeg failed for annotation ${annotation.id} with exit code ${exitCode}.`);
                }
                const outputData = await ffmpeg.readFile(outputName);
                const blob = dataToBlob(outputData);
                setStatus("uploading");
                appendLog(`Uploading clip (${formatBytes(blob.size)}).`);
                await uploadAnnotationClip(annotation.id, {clip: blob, durationMs: annotation.endTimeMs - annotation.startTimeMs});
                await ffmpeg.deleteFile(outputName).catch(() => true);
            }

            setStatus("finalizing");
            appendLog("Creating practice tasks and study cards from uploaded clips...");
            const exportResult = await exportReviewSession(sessionId);
            setResult(exportResult);
            setAnnotations(await listAnnotations(sessionId));
            setStatus("done");
            appendLog("Export complete.");
            await ffmpeg.unmount(mountPoint).catch(() => true);
        } catch (caughtError: unknown) {
            setStatus("failed");
            setError(getErrorMessage(caughtError));
        }
    };

    const selectedFileMismatch = Boolean(expectedFile && file && file.name !== expectedFile.filename);

    return (
        <PageShell
            title="Export Replay Clips"
            badgeLabel="Replay Lab Export"
        >
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", xl: "0.9fr 1.1fr"}, gap: 1.5}}>
                <SectionCard title="Source File" tone="raised" variant="input">
                    <AppStack spacing={1.1}>
                        {error ? <AppAlert severity="error" onClose={() => setError(null)}>{error}</AppAlert> : null}
                        {!isIsolated ? <AppAlert severity="warning">Browser export headers are not active. Restart the frontend dev server and open this page directly.</AppAlert> : null}
                        {expectedFile ? (
                            <AppAlert severity="info">Expected source: {expectedFile.filename} ({formatBytes(expectedFile.sizeBytes)}). Re-select that same local file below.</AppAlert>
                        ) : null}
                        {selectedFileMismatch ? <AppAlert severity="warning">Selected file name does not match the source used to create this review.</AppAlert> : null}
                        <AppButton type="button" component="label" variant="outlined">
                            Select Local Source File
                            <input hidden type="file" accept="video/mp4,.mp4" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                        </AppButton>
                        <AppTypography color="text.secondary">{file ? `${file.name} (${formatBytes(file.size)})` : "No file selected"}</AppTypography>
                        <AppButton type="button" disabled={!session || !file || selectedFileMismatch || ["loading", "exporting", "uploading", "finalizing"].includes(status)} onClick={() => void runExport()}>
                            Generate Exact Clips and Finalize
                        </AppButton>
                        <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <AppChip label={status === "idle" ? "Ready" : status} />
                            {status !== "idle" && status !== "done" && status !== "failed" ? <AppChip label={`${Math.round(progress * 100)}%`} variant="outlined" /> : null}
                        </AppStack>
                        {result ? (
                            <AppAlert severity={result.failed > 0 ? "warning" : "success"}>
                                Export summary: {result.clipsCreated} new clips, {result.tasksCreated} tasks, {result.studyCardsCreated} study cards, {result.skipped} skipped, {result.failed} failed.
                            </AppAlert>
                        ) : null}
                    </AppStack>
                </SectionCard>

                <SectionCard title="Clips" tone="sunken" variant="finalize">
                    <AppStack spacing={1}>
                        {annotations.map((annotation) => (
                            <AppBox key={annotation.id} sx={(theme) => ({display: "grid", gap: 0.35, p: 1, border: "1px solid", borderColor: theme.fgc.border.default, borderRadius: 1.25, backgroundColor: theme.fgc.surface.base})}>
                                <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                    <AppChip size="small" label={`${formatTimestamp(annotation.startTimeMs)} - ${formatTimestamp(annotation.endTimeMs)}`} />
                                    <AppChip size="small" variant="outlined" label={annotation.eventKind === "memory" ? "Memory" : "Task"} />
                                    {annotation.exportedClip ? <AppChip size="small" color="success" label="Clip uploaded" /> : null}
                                </AppStack>
                                <AppTypography variant="subtitle2">{annotation.title || annotation.category}</AppTypography>
                            </AppBox>
                        ))}
                        <AppBox sx={(theme) => ({maxHeight: 360, overflow: "auto", p: 1, border: "1px solid", borderColor: theme.fgc.border.default, borderRadius: 1.25, backgroundColor: theme.fgc.surface.sunken})}>
                            {logs.length === 0 ? <AppTypography color="text.secondary">Export progress will appear here.</AppTypography> : null}
                            {logs.map((log) => <AppTypography key={log} variant="caption" component="pre" sx={{whiteSpace: "pre-wrap", m: 0}}>{log}</AppTypography>)}
                        </AppBox>
                    </AppStack>
                </SectionCard>
            </AppBox>
        </PageShell>
    );
}
