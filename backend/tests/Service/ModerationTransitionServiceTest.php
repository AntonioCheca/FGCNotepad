<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Scenario;
use App\Entity\User;
use App\Service\AuthorizationPolicyService;
use App\Service\ModerationTransitionService;
use App\Util\Enum\ModerationState;
use App\Util\Enum\UserRole;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class ModerationTransitionServiceTest extends TestCase
{
    private ModerationTransitionService $service;

    protected function setUp(): void
    {
        $this->service = new ModerationTransitionService(new AuthorizationPolicyService());
    }

    public function testSubmitForReviewSetsPendingAndClearsDecisionMetadata(): void
    {
        $scenario = (new Scenario())
            ->setName('A')
            ->setModerationState(ModerationState::APPROVED->value)
            ->setModerationReason('old reason');

        $this->service->submitScenarioForReview($scenario);

        self::assertSame(ModerationState::PENDING_REVIEW->value, $scenario->getModerationState());
        self::assertNotNull($scenario->getSubmittedForReviewAt());
        self::assertNull($scenario->getModerationDecidedAt());
        self::assertNull($scenario->getModerationDecidedBy());
        self::assertNull($scenario->getModerationReason());
    }

    public function testModeratorCanApproveHiddenContent(): void
    {
        $scenario = (new Scenario())
            ->setName('A')
            ->setModerationState(ModerationState::HIDDEN->value);
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);

        $this->service->moderateScenario($scenario, $moderator, ModerationState::APPROVED->value, null);

        self::assertSame(ModerationState::APPROVED->value, $scenario->getModerationState());
        self::assertNotNull($scenario->getModerationDecidedAt());
        self::assertSame($moderator, $scenario->getModerationDecidedBy());
    }

    public function testRejectRequiresReason(): void
    {
        $scenario = (new Scenario())
            ->setName('A')
            ->setModerationState(ModerationState::PENDING_REVIEW->value);
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);

        $this->expectException(BadRequestHttpException::class);
        $this->service->moderateScenario($scenario, $moderator, ModerationState::REJECTED->value, null);
    }

    public function testUserCannotModerateContent(): void
    {
        $scenario = (new Scenario())
            ->setName('A')
            ->setModerationState(ModerationState::PENDING_REVIEW->value);
        $user = $this->newUser('user', [UserRole::USER]);

        $this->expectException(AccessDeniedHttpException::class);
        $this->service->moderateScenario($scenario, $user, ModerationState::APPROVED->value, null);
    }

    public function testCannotTargetPendingReviewViaModerationAction(): void
    {
        $scenario = (new Scenario())
            ->setName('A')
            ->setModerationState(ModerationState::APPROVED->value);
        $admin = $this->newUser('admin', [UserRole::ADMIN]);

        $this->expectException(BadRequestHttpException::class);
        $this->service->moderateScenario($scenario, $admin, ModerationState::PENDING_REVIEW->value, null);
    }

    public function testDuplicateTargetStateThrowsConflict(): void
    {
        $scenario = (new Scenario())
            ->setName('A')
            ->setModerationState(ModerationState::APPROVED->value);
        $admin = $this->newUser('admin', [UserRole::ADMIN]);

        $this->expectException(ConflictHttpException::class);
        $this->service->moderateScenario($scenario, $admin, ModerationState::APPROVED->value, null);
    }

    public function testHideRequiresReason(): void
    {
        $scenario = (new Scenario())
            ->setName('A')
            ->setModerationState(ModerationState::PENDING_REVIEW->value);
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);

        $this->expectException(BadRequestHttpException::class);
        $this->service->moderateScenario($scenario, $moderator, ModerationState::HIDDEN->value, null);
    }

    public function testRejectReasonIsTrimmedBeforePersisting(): void
    {
        $scenario = (new Scenario())
            ->setName('A')
            ->setModerationState(ModerationState::PENDING_REVIEW->value);
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);

        $this->service->moderateScenario($scenario, $moderator, ModerationState::REJECTED->value, '  policy violation  ');

        self::assertSame(ModerationState::REJECTED->value, $scenario->getModerationState());
        self::assertSame('policy violation', $scenario->getModerationReason());
    }

    public function testSubmitForReviewFromRejectedClearsPriorDecisionMetadata(): void
    {
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);
        $scenario = (new Scenario())
            ->setName('A')
            ->setModerationState(ModerationState::REJECTED->value)
            ->setModerationDecidedBy($moderator)
            ->setModerationDecidedAt(new \DateTimeImmutable('-1 day'))
            ->setModerationReason('old reason');

        $this->service->submitScenarioForReview($scenario);

        self::assertSame(ModerationState::PENDING_REVIEW->value, $scenario->getModerationState());
        self::assertNotNull($scenario->getSubmittedForReviewAt());
        self::assertNull($scenario->getModerationDecidedAt());
        self::assertNull($scenario->getModerationDecidedBy());
        self::assertNull($scenario->getModerationReason());
    }

    /**
     * @param list<UserRole> $roles
     */
    private function newUser(string $username, array $roles): User
    {
        $user = new User();
        $user->setUsername($username);
        $user->setPassword('hash');
        $user->setRoles(array_map(static fn (UserRole $role): string => $role->value, $roles));

        return $user;
    }
}
