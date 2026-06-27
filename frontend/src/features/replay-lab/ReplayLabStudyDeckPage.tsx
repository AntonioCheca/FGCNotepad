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
import {
    replayMemoryCategories,
    type ReplayMemoryCategory,
    type StudyCard,
    type StudyCardReviewResponse,
    type StudyReviewRating,
} from "@/src/types/replayLab";

function humanizeCategory(category: string): string {
    return category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {dateStyle: "medium", timeStyle: "short"}).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "response" in error) {
        const status = (error as {response?: {status?: number}}).response?.status;
        if (typeof status === "number") {
            return `Request failed with status ${status}.`;
        }
    }

    return error instanceof Error ? error.message : "Study deck request failed.";
}

export function ReplayLabStudyDeckPage() {
    const {loading, listDueStudyCards, reviewStudyCard} = useReplayLab();
    const [cards, setCards] = React.useState<StudyCard[]>([]);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [selectedAnswer, setSelectedAnswer] = React.useState<ReplayMemoryCategory | null>(null);
    const [reviewResult, setReviewResult] = React.useState<StudyCardReviewResponse | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [notice, setNotice] = React.useState<string | null>(null);

    const activeCard = cards[activeIndex] ?? null;

    const refreshCards = React.useCallback(async () => {
        const payload = await listDueStudyCards();
        setCards(payload);
        setActiveIndex(0);
        setSelectedAnswer(null);
        setReviewResult(null);
    }, [listDueStudyCards]);

    React.useEffect(() => {
        void refreshCards().catch((caughtError: unknown) => setError(getErrorMessage(caughtError)));
    }, [refreshCards]);

    const submitReview = async (rating: StudyReviewRating) => {
        if (!activeCard || !selectedAnswer) {
            setError("Choose an answer before reviewing this card.");
            return;
        }

        setError(null);
        setNotice(null);
        try {
            const result = await reviewStudyCard(activeCard.id, rating, selectedAnswer === activeCard.category);
            setReviewResult(result);
        } catch (caughtError: unknown) {
            setError(getErrorMessage(caughtError));
        }
    };

    const nextCard = () => {
        setSelectedAnswer(null);
        setReviewResult(null);
        setNotice(null);
        setActiveIndex((current) => current + 1);
    };

    const reloadDueCards = async () => {
        setNotice(null);
        await refreshCards();
    };

    const remainingCards = Math.max(0, cards.length - activeIndex - (reviewResult ? 1 : 0));

    return (
        <PageShell
            title="Study Deck"
            subtitle="Review due replay cards with permanent clips and the simple Again/Good scheduler."
            badgeLabel="Replay Lab"
        >
            <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", xl: "1.08fr 0.92fr"}, gap: 1.5}}>
                <SectionCard
                    title="Due card"
                    description="Identify the situation in the clip, then grade the review. The correct answer appears after submitting."
                    tone="raised"
                    variant="review"
                >
                    <AppStack spacing={1.1}>
                        {error ? <AppAlert severity="error" onClose={() => setError(null)}>{error}</AppAlert> : null}
                        {notice ? <AppAlert severity="success" onClose={() => setNotice(null)}>{notice}</AppAlert> : null}
                        {loading && cards.length === 0 ? <AppCircularProgress size={24} /> : null}
                        {!activeCard && !loading ? (
                            <AppBox sx={{display: "grid", gap: 1}}>
                                <AppTypography color="text.secondary">No due cards right now.</AppTypography>
                                <AppButton type="button" variant="outlined" onClick={() => void reloadDueCards()} disabled={loading}>Refresh Due Cards</AppButton>
                            </AppBox>
                        ) : null}
                        {activeCard ? (
                            <>
                                <ReplayClipPlayer clip={activeCard.clip} title={activeCard.prompt} />
                                <AppTypography variant="h6">{activeCard.prompt}</AppTypography>
                                <AppTypography variant="body2" color="text.secondary">
                                    Due {formatDate(activeCard.dueAt)} · interval {activeCard.intervalDays}d · reps {activeCard.repetitionCount} · lapses {activeCard.lapseCount}
                                </AppTypography>
                                <AppBox sx={{display: "grid", gridTemplateColumns: {xs: "1fr", md: "1fr 1fr"}, gap: 0.75}}>
                                    {replayMemoryCategories.map((category) => (
                                        <AppButton
                                            key={category}
                                            type="button"
                                            variant={selectedAnswer === category ? "contained" : "outlined"}
                                            onClick={() => setSelectedAnswer(category)}
                                            disabled={Boolean(reviewResult)}
                                        >
                                            {humanizeCategory(category)}
                                        </AppButton>
                                    ))}
                                </AppBox>
                                {reviewResult ? (
                                    <AppAlert severity={reviewResult.review.wasCorrect ? "success" : "warning"}>
                                        You chose {selectedAnswer ? humanizeCategory(selectedAnswer) : "nothing"}. Correct answer: {reviewResult.card.correctAnswer}. Next due: {formatDate(reviewResult.review.nextDueAt)}.
                                    </AppAlert>
                                ) : null}
                                <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                    <AppButton type="button" variant="outlined" color="secondary" disabled={!selectedAnswer || Boolean(reviewResult) || loading} onClick={() => void submitReview("again")}>
                                        Again
                                    </AppButton>
                                    <AppButton type="button" variant="outlined" disabled={!selectedAnswer || Boolean(reviewResult) || loading} onClick={() => void submitReview("hard")}>
                                        Hard
                                    </AppButton>
                                    <AppButton type="button" disabled={!selectedAnswer || Boolean(reviewResult) || loading} onClick={() => void submitReview("good")}>
                                        Good
                                    </AppButton>
                                    <AppButton type="button" variant="outlined" disabled={!selectedAnswer || Boolean(reviewResult) || loading} onClick={() => void submitReview("easy")}>
                                        Easy
                                    </AppButton>
                                    <AppButton type="button" variant="outlined" disabled={!reviewResult} onClick={nextCard}>
                                        {activeIndex + 1 >= cards.length ? "Finish Queue" : "Next Card"}
                                    </AppButton>
                                </AppStack>
                            </>
                        ) : null}
                    </AppStack>
                </SectionCard>

                <SectionCard
                    title="Queue status"
                    description="Only due cards are loaded. Future cards stay hidden until their scheduled time."
                    tone="sunken"
                    variant="finalize"
                >
                    <AppStack spacing={1}>
                        <AppStack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <AppChip label={`${cards.length} due loaded`} />
                            <AppChip label={`${remainingCards} remaining`} variant="outlined" />
                        </AppStack>
                        {cards.slice(activeIndex + (reviewResult ? 1 : 0), activeIndex + 6).map((card) => (
                            <AppBox
                                key={card.id}
                                sx={(theme) => ({
                                    display: "grid",
                                    gap: 0.35,
                                    p: 1,
                                    border: "1px solid",
                                    borderColor: theme.fgc.border.default,
                                    borderRadius: 1.25,
                                    backgroundColor: theme.fgc.surface.base,
                                })}
                            >
                                <AppTypography variant="subtitle2">{card.prompt}</AppTypography>
                                <AppTypography variant="caption" color="text.secondary">{humanizeCategory(card.category)} · due {formatDate(card.dueAt)}</AppTypography>
                            </AppBox>
                        ))}
                        {cards.length === 0 ? <AppTypography color="text.secondary">Export memory annotations from a review session to create study cards.</AppTypography> : null}
                    </AppStack>
                </SectionCard>
            </AppBox>
        </PageShell>
    );
}
