import React from "react";
import {useReplayLab} from "@/hooks/useReplayLab";
import {AppAlert} from "@/src/components/ui/AppAlert";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppCircularProgress} from "@/src/components/ui/AppCircularProgress";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";
import {ReplayClipPlayer} from "@/src/features/replay-lab/ReplayClipPlayer";
import {formatUtcDateTime} from "@/src/utils/formatDateTime";
import type {PracticeTask, PracticeTaskStatus} from "@/src/types/replayLab";

function humanizeCategory(category: string): string {
    return category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "response" in error) {
        const status = (error as {response?: {status?: number}}).response?.status;
        if (typeof status === "number") {
            return `Request failed with status ${status}.`;
        }
    }

    return error instanceof Error ? error.message : "Practice task request failed.";
}

export function ReplayLabPracticeTasksPage() {
    const {loading, listPracticeTasks, completePracticeTask, dismissPracticeTask} = useReplayLab();
    const [tasks, setTasks] = React.useState<PracticeTask[]>([]);
    const [statusFilter, setStatusFilter] = React.useState<PracticeTaskStatus>("pending");
    const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [notice, setNotice] = React.useState<string | null>(null);

    const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;

    const refreshTasks = React.useCallback(async () => {
        const payload = await listPracticeTasks(statusFilter);
        setTasks(payload);
        setSelectedTaskId((current) => current && payload.some((task) => task.id === current) ? current : payload[0]?.id ?? null);
    }, [listPracticeTasks, statusFilter]);

    React.useEffect(() => {
        void refreshTasks().catch((caughtError: unknown) => setError(getErrorMessage(caughtError)));
    }, [refreshTasks]);

    const completeTask = async (task: PracticeTask) => {
        setError(null);
        setNotice(null);
        try {
            await completePracticeTask(task.id);
            setNotice(`Completed ${task.title}.`);
            await refreshTasks();
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        }
    };

    const dismissTask = async (task: PracticeTask) => {
        setError(null);
        setNotice(null);
        try {
            await dismissPracticeTask(task.id);
            setNotice(`Dismissed ${task.title}.`);
            await refreshTasks();
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        }
    };

    return (
        <PageShell
            title="Practice Tasks"
            subtitle="Run execution drills generated from replay annotations. Pending tasks remain visible until completed or dismissed."
            badgeLabel="Replay Lab"
        >
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", xl: "0.92fr 1.08fr"}, gap: 1.5}}>
                <SectionCard
                    title="Pending drills"
                    description="Tasks stay pending until completed or dismissed, even if a due date has passed."
                    tone="raised"
                    variant="review"
                >
                    <AppStack spacing={1}>
                        {error ? <AppAlert severity="error" onClose={() => setError(null)}>{error}</AppAlert> : null}
                        {notice ? <AppAlert severity="success" onClose={() => setNotice(null)}>{notice}</AppAlert> : null}
                        <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            {(["pending", "done", "dismissed"] as const).map((status) => (
                                <AppButton
                                    key={status}
                                    type="button"
                                    size="small"
                                    variant={statusFilter === status ? "contained" : "outlined"}
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status === "pending" ? "Pending" : status === "done" ? "Done" : "Dismissed"}
                                </AppButton>
                            ))}
                        </AppStack>
                        {loading && tasks.length === 0 ? <AppCircularProgress size={24} /> : null}
                        {tasks.length === 0 && !loading ? <AppTypography color="text.secondary">No {statusFilter} practice tasks.</AppTypography> : null}
                        {tasks.map((task) => {
                            const isSelected = selectedTask?.id === task.id;

                            return (
                                <AppBox
                                    key={task.id}
                                    sx={(theme) => ({
                                        display: "grid",
                                        gap: 0.75,
                                        p: 1.1,
                                        border: "1px solid",
                                        borderColor: isSelected ? theme.fgc.border.strong : theme.fgc.border.default,
                                        borderRadius: 1.25,
                                        backgroundColor: isSelected ? theme.fgc.surface.raised : theme.fgc.surface.base,
                                    })}
                                >
                                    <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                        <AppChip size="small" label={humanizeCategory(task.category)} />
                                        <AppChip size="small" variant="outlined" label={task.status} />
                                        <AppChip size="small" variant="outlined" label={formatUtcDateTime(task.dueDate, "No due date")} />
                                        <AppChip size="small" variant="outlined" label={`${task.completedOccurrences}/${task.completedOccurrences + task.remainingOccurrences} done`} />
                                    </AppStack>
                                    <AppTypography variant="subtitle1" sx={{fontWeight: 650}}>{task.title}</AppTypography>
                                    <AppTypography variant="body2" color="text.secondary">{task.description}</AppTypography>
                                    <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                        <AppButton type="button" variant={isSelected ? "contained" : "outlined"} onClick={() => setSelectedTaskId(task.id)}>Open</AppButton>
                                        <AppButton type="button" variant="outlined" onClick={() => void completeTask(task)} disabled={loading || task.status !== "pending"}>Complete</AppButton>
                                        <AppButton type="button" variant="outlined" color="secondary" onClick={() => void dismissTask(task)} disabled={loading || task.status !== "pending"}>Dismiss</AppButton>
                                    </AppStack>
                                </AppBox>
                            );
                        })}
                    </AppStack>
                </SectionCard>

                <SectionCard
                    title="Drill clip"
                    description="Watch the permanent clip, perform the drill, then complete or dismiss the task."
                    tone="sunken"
                    variant="finalize"
                >
                    <AppStack spacing={1.1}>
                        {selectedTask ? (
                            <>
                                <ReplayClipPlayer clip={selectedTask.clip} title={selectedTask.title} />
                                <AppBox sx={{display: "grid", gap: 0.45}}>
                                    <AppTypography variant="h6">{selectedTask.title}</AppTypography>
                                    <AppTypography color="text.secondary">{selectedTask.description}</AppTypography>
                                    <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                        <AppChip size="small" label={humanizeCategory(selectedTask.category)} />
                                        <AppChip size="small" variant="outlined" label={`Schedule: ${selectedTask.scheduleType.replace(/_/g, " ")}`} />
                                        <AppChip size="small" variant="outlined" label={`${selectedTask.remainingOccurrences} remaining`} />
                                    </AppStack>
                                </AppBox>
                                <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                    <AppButton type="button" onClick={() => void completeTask(selectedTask)} disabled={loading || selectedTask.status !== "pending"}>Complete Task</AppButton>
                                    <AppButton type="button" variant="outlined" color="secondary" onClick={() => void dismissTask(selectedTask)} disabled={loading || selectedTask.status !== "pending"}>Dismiss Task</AppButton>
                                </AppStack>
                            </>
                        ) : (
                            <AppTypography color="text.secondary">Select a pending task to review its clip.</AppTypography>
                        )}
                    </AppStack>
                </SectionCard>
            </AppBox>
        </PageShell>
    );
}
