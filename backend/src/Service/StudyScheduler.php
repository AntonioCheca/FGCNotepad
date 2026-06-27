<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\StudyCard;
use App\Entity\StudyReviewLog;

final class StudyScheduler
{
    /**
     * @var list<int>
     */
    private const GOOD_INTERVALS = [1, 3, 7, 14, 30];

    public function review(StudyCard $card, string $rating, bool $wasCorrect, \DateTimeImmutable $reviewedAt): StudyReviewLog
    {
        $previousDueAt = $card->getDueAt();
        $nextIntervalDays = $this->nextIntervalDays($card, $rating, $wasCorrect);
        $nextDueAt = $reviewedAt->modify(sprintf('+%d days', $nextIntervalDays));

        $card
            ->setIntervalDays($nextIntervalDays)
            ->setDueAt($nextDueAt)
            ->setUpdatedAt($reviewedAt);

        if (StudyReviewLog::RATING_AGAIN === $rating || !$wasCorrect) {
            $card
                ->setLapseCount($card->getLapseCount() + 1)
                ->setRepetitionCount(0);
        } else {
            $card->setRepetitionCount($card->getRepetitionCount() + 1);
        }

        return (new StudyReviewLog())
            ->setCard($card)
            ->setUser($card->getUser())
            ->setRating($rating)
            ->setWasCorrect($wasCorrect)
            ->setReviewedAt($reviewedAt)
            ->setPreviousDueAt($previousDueAt)
            ->setNextDueAt($nextDueAt);
    }

    private function nextIntervalDays(StudyCard $card, string $rating, bool $wasCorrect): int
    {
        if (StudyReviewLog::RATING_AGAIN === $rating || !$wasCorrect) {
            return 1;
        }

        $index = min($card->getRepetitionCount(), count(self::GOOD_INTERVALS) - 1);

        return self::GOOD_INTERVALS[$index];
    }
}
