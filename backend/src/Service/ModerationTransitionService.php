<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboSequences;
use App\Entity\BlockstringSequence;
use App\Entity\Scenario;
use App\Entity\User;
use App\Util\Enum\ModerationState;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class ModerationTransitionService
{
    public function __construct(
        private readonly AuthorizationPolicyService $authorizationPolicyService,
    ) {
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

    public function submitBlockstringForReview(BlockstringSequence $blockstring): void
    {
        $this->submitForReview(
            static fn (): string => $blockstring->getModerationState(),
            static fn (string $state) => $blockstring->setModerationState($state),
            static fn (?\DateTimeImmutable $submittedAt) => $blockstring->setSubmittedForReviewAt($submittedAt),
            static fn (?\DateTimeImmutable $decidedAt) => $blockstring->setModerationDecidedAt($decidedAt),
            static fn (?User $decider) => $blockstring->setModerationDecidedBy($decider),
            static fn (?string $reason) => $blockstring->setModerationReason($reason),
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

    public function approveCombo(ComboSequences $combo, User $actor): void
    {
        $this->moderateCombo($combo, $actor, ModerationState::APPROVED->value, null);
    }

    public function rejectCombo(ComboSequences $combo, User $actor, string $reason): void
    {
        $this->moderateCombo($combo, $actor, ModerationState::REJECTED->value, $reason);
    }

    public function hideCombo(ComboSequences $combo, User $actor, string $reason): void
    {
        $this->moderateCombo($combo, $actor, ModerationState::HIDDEN->value, $reason);
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

    public function approveScenario(Scenario $scenario, User $actor): void
    {
        $this->moderateScenario($scenario, $actor, ModerationState::APPROVED->value, null);
    }

    public function rejectScenario(Scenario $scenario, User $actor, string $reason): void
    {
        $this->moderateScenario($scenario, $actor, ModerationState::REJECTED->value, $reason);
    }

    public function hideScenario(Scenario $scenario, User $actor, string $reason): void
    {
        $this->moderateScenario($scenario, $actor, ModerationState::HIDDEN->value, $reason);
    }

    /**
     * @param \Closure():string $getState
     * @param \Closure(string):mixed $setState
     * @param \Closure(?\DateTimeImmutable):mixed $setSubmittedAt
     * @param \Closure(?\DateTimeImmutable):mixed $setDecidedAt
     * @param \Closure(?User):mixed $setDecidedBy
     * @param \Closure(?string):mixed $setReason
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
     * @param \Closure(string):mixed $setState
     * @param \Closure(?\DateTimeImmutable):mixed $setSubmittedAt
     * @param \Closure(?\DateTimeImmutable):mixed $setDecidedAt
     * @param \Closure(?User):mixed $setDecidedBy
     * @param \Closure(?string):mixed $setReason
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

        if ($current === $target) {
            throw new ConflictHttpException(sprintf('Content is already in %s state.', $target->value));
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
