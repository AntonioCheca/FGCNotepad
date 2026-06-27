import Link from "next/link";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppButton} from "@/src/components/ui/AppButton";
import {AppChip} from "@/src/components/ui/AppChip";
import {AppStack} from "@/src/components/ui/AppStack";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

interface ReplayLabPlaceholderPageProps {
    title: string;
    subtitle: string;
    activeStep: "review" | "practice" | "study";
}

const stages = [
    {
        key: "review",
        label: "Review Replays",
        href: "/replay-lab",
        description: "Upload a temporary replay, open a review session, and mark important moments.",
    },
    {
        key: "practice",
        label: "Practice Tasks",
        href: "/replay-lab/practice-tasks",
        description: "Turn execution mistakes into pending drills backed by permanent clips.",
    },
    {
        key: "study",
        label: "Study Deck",
        href: "/replay-lab/study-deck",
        description: "Review knowledge checks with spaced repetition and short video clips.",
    },
] as const;

export function ReplayLabPlaceholderPage({title, subtitle, activeStep}: ReplayLabPlaceholderPageProps) {
    return (
        <PageShell title={title} subtitle={subtitle} badgeLabel="Replay Lab MVP">
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", lg: "1.15fr 0.85fr"}, gap: 1.5}}>
                <SectionCard
                    title="Current implementation window"
                    description="The backend foundation is being wired first: video upload, review sessions, and annotations. Clip export, task generation, and study flow come next."
                    tone="raised"
                    variant="review"
                >
                    <AppStack spacing={1.1}>
                        {stages.map((stage, index) => {
                            const isActive = stage.key === activeStep;

                            return (
                                <AppBox
                                    key={stage.key}
                                    sx={(theme) => ({
                                        display: "grid",
                                        gridTemplateColumns: "auto 1fr auto",
                                        gap: 1,
                                        alignItems: "center",
                                        p: 1.1,
                                        border: "1px solid",
                                        borderColor: isActive ? theme.fgc.border.strong : theme.fgc.border.default,
                                        borderRadius: 1.25,
                                        backgroundColor: isActive ? theme.fgc.surface.raised : theme.fgc.surface.sunken,
                                    })}
                                >
                                    <AppChip size="small" label={String(index + 1).padStart(2, "0")} />
                                    <AppBox sx={{display: "grid", gap: 0.25}}>
                                        <AppTypography variant="subtitle2">{stage.label}</AppTypography>
                                        <AppTypography variant="body2" color="text.secondary">{stage.description}</AppTypography>
                                    </AppBox>
                                    <AppButton component={Link} href={stage.href} variant={isActive ? "contained" : "outlined"} size="small">
                                        Open
                                    </AppButton>
                                </AppBox>
                            );
                        })}
                    </AppStack>
                </SectionCard>

                <SectionCard
                    title="MVP contract"
                    description="Replay originals are temporary review material. Exported clips become the permanent learning artifact."
                    tone="sunken"
                    variant="finalize"
                >
                    <AppStack spacing={0.9}>
                        <AppTypography variant="body2">Replay storage uses separate `replays/` and `clips/` prefixes.</AppTypography>
                        <AppTypography variant="body2">Annotations keep timestamps even after physical clips are generated.</AppTypography>
                        <AppTypography variant="body2">Practice tasks and study cards will depend on permanent `ReplayClip` records.</AppTypography>
                    </AppStack>
                </SectionCard>
            </AppBox>
        </PageShell>
    );
}
