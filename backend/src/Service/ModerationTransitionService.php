<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboSequences;
use App\Entity\Post;
use App\Entity\Scenario;
use App\Entity\User;
use App\Util\Enum\ModerationState;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class ModerationTransitionService
{
    public function __construct(
        private readonly AuthorizationPolicyService $authorizationPolicyService,
    ) {
    }

    public function submitPostForReview(Post $post): void
    {
        $this->submitForReview(
            static fn (): string => $post->getModerationState(),
            static fn (string $state) => $post->setModerationState($state),
            static fn (?\DateTimeImmutable $submittedAt) => $post->setSubmittedForReviewAt($submittedAt),
            static fn (?\DateTimeImmutable $decidedAt) => $post->setModerationDecidedAt($decidedAt),
            static fn (?User $decider) => $post->setModerationDecidedBy($decider),
            static fn (?string $reason) => $post->setModerationReason($reason),
        );
    }

    public function submitComboForReview(ComboSequences $combo): void
    {
        $this->submitForReview(
            static fn (): string => $combo->getModerationState(),
            static fn (string $state) => $combo->setModerationState($state),
            static fn (?\DateTimeImmutable $submittedAt) => $combo->setSubmittedForReviewAt($submittedAt),
            static fn (?\DateTimeImmutable $decidedAt) => $combo->setModerationDecidedAt($decidedAt),
            static fn (?User $decider) => $combo->setModerationDecidedBy($decider),
            static fn (?string $reason) => $combo->setModerationReason($reason),
        );
    }

    public function submitScenarioForReview(Scenario $scenario): void
    {
        $this->submitForReview(
            static fn (): string => $scenario->getModerationState(),
            static fn (string $state) => $scenario->setModerationState($state),
            static fn (?\DateTimeImmutable $submittedAt) => $scenario->setSubmittedForReviewAt($submittedAt),
            static fn (?\DateTimeImmutable $decidedAt) => $scenario->setModerationDecidedAt($decidedAt),
            static fn (?User $decider) => $scenario->setModerationDecidedBy($decider),
            static fn (?string $reason) => $scenario->setModerationReason($reason),
        );
    }

    public function moderatePost(Post $post, User $actor, string $targetState, ?string $reason): void
    {
        $this->moderate(
            static fn (): string => $post->getModerationState(),
            static fn (string $state) => $post->setModerationState($state),
            static fn (?\DateTimeImmutable $submittedAt) => $post->setSubmittedForReviewAt($submittedAt),
            static fn (?\DateTimeImmutable $decidedAt) => $post->setModerationDecidedAt($decidedAt),
            static fn (?User $decider) => $post->setModerationDecidedBy($decider),
            static fn (?string $moderationReason) => $post->setModerationReason($moderationReason),
            $actor,
            $targetState,
            $reason,
        );
    }

    public function moderateCombo(ComboSequences $combo, User $actor, string $targetState, ?string $reason): void
    {
        $this->moderate(
            static fn (): string => $combo->getModerationState(),
            static fn (string $state) => $combo->setModerationState($state),
            static fn (?\DateTimeImmutable $submittedAt) => $combo->setSubmittedForReviewAt($submittedAt),
            static fn (?\DateTimeImmutable $decidedAt) => $combo->setModerationDecidedAt($decidedAt),
            static fn (?User $decider) => $combo->setModerationDecidedBy($decider),
            static fn (?string $moderationReason) => $combo->setModerationReason($moderationReason),
            $actor,
            $targetState,
            $reason,
        );
    }

    public function moderateScenario(Scenario $scenario, User $actor, string $targetState, ?string $reason): void
    {
        $this->moderate(
            static fn (): string => $scenario->getModerationState(),
            static fn (string $state) => $scenario->setModerationState($state),
            static fn (?\DateTimeImmutable $submittedAt) => $scenario->setSubmittedForReviewAt($submittedAt),
            static fn (?\DateTimeImmutable $decidedAt) => $scenario->setModerationDecidedAt($decidedAt),
            static fn (?User $decider) => $scenario->setModerationDecidedBy($decider),
            static fn (?string $moderationReason) => $scenario->setModerationReason($moderationReason),
            $actor,
            $targetState,
            $reason,
        );
    }

    /**
     * @param \Closure():string $getState
     * @param \Closure(string):void $setState
     * @param \Closure(?\DateTimeImmutable):void $setSubmittedAt
     * @param \Closure(?\DateTimeImmutable):void $setDecidedAt
     * @param \Closure(?User):void $setDecidedBy
     * @param \Closure(?string):void $setReason
     */
    private function submitForReview(
        \Closure $getState,
        \Closure $setState,
        \Closure $setSubmittedAt,
        \Closure $setDecidedAt,
        \Closure $setDecidedBy,
        \Closure $setReason,
    ): void {
        $currentState = $getState();
        if (!ModerationState::isValid($currentState)) {
            throw new BadRequestHttpException(sprintf('Invalid moderation state: %s', $currentState));
        }

        $setState(ModerationState::PENDING_REVIEW->value);
        $setSubmittedAt(new \DateTimeImmutable());
        $setDecidedAt(null);
        $setDecidedBy(null);
        $setReason(null);
    }

    /**
     * @param \Closure():string $getState
     * @param \Closure(string):void $setState
     * @param \Closure(?\DateTimeImmutable):void $setSubmittedAt
     * @param \Closure(?\DateTimeImmutable):void $setDecidedAt
     * @param \Closure(?User):void $setDecidedBy
     * @param \Closure(?string):void $setReason
     */
    private function moderate(
        \Closure $getState,
        \Closure $setState,
        \Closure $setSubmittedAt,
        \Closure $setDecidedAt,
        \Closure $setDecidedBy,
        \Closure $setReason,
        User $actor,
        string $targetState,
        ?string $reason,
    ): void {
        if (!$this->authorizationPolicyService->canModerateContent($actor)) {
            throw new AccessDeniedHttpException('Only moderators and admins can moderate content.');
        }

        $normalizedTargetState = trim(mb_strtolower($targetState));
        $target = ModerationState::tryFrom($normalizedTargetState);
        if (null === $target || ModerationState::PENDING_REVIEW === $target) {
            throw new BadRequestHttpException('Invalid moderation target state.');
        }

        $current = ModerationState::tryFrom($getState());
        if (null === $current) {
            throw new BadRequestHttpException('Invalid current moderation state.');
        }

        if (!$this->isTransitionAllowed($current, $target)) {
            throw new BadRequestHttpException(sprintf('Cannot transition moderation state from %s to %s.', $current->value, $target->value));
        }

        $normalizedReason = null;
        if (null !== $reason) {
            $trimmedReason = trim($reason);
            $normalizedReason = '' === $trimmedReason ? null : $trimmedReason;
        }

        if (in_array($target, [ModerationState::REJECTED, ModerationState::HIDDEN], true) && null === $normalizedReason) {
            throw new BadRequestHttpException('Moderation reason is required for rejected and hidden states.');
        }

        $setState($target->value);
        $setSubmittedAt(null);
        $setDecidedAt(new \DateTimeImmutable());
        $setDecidedBy($actor);
        $setReason($normalizedReason);
    }

    private function isTransitionAllowed(ModerationState $from, ModerationState $to): bool
    {
        if ($from === $to) {
            return true;
        }

        return match ($to) {
            ModerationState::APPROVED => in_array($from, [
                ModerationState::PENDING_REVIEW,
                ModerationState::REJECTED,
                ModerationState::HIDDEN,
            ], true),
            ModerationState::REJECTED => in_array($from, [
                ModerationState::PENDING_REVIEW,
                ModerationState::APPROVED,
                ModerationState::HIDDEN,
            ], true),
            ModerationState::HIDDEN => in_array($from, [
                ModerationState::PENDING_REVIEW,
                ModerationState::APPROVED,
                ModerationState::REJECTED,
            ], true),
            ModerationState::PENDING_REVIEW => false,
        };
    }
}
