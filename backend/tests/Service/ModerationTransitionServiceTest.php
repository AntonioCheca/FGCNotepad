<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Post;
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
        $post = (new Post())
            ->setTitle('A')
            ->setBody('B')
            ->setModerationState(ModerationState::APPROVED->value)
            ->setModerationReason('old reason');

        $this->service->submitPostForReview($post);

        self::assertSame(ModerationState::PENDING_REVIEW->value, $post->getModerationState());
        self::assertNotNull($post->getSubmittedForReviewAt());
        self::assertNull($post->getModerationDecidedAt());
        self::assertNull($post->getModerationDecidedBy());
        self::assertNull($post->getModerationReason());
    }

    public function testModeratorCanApproveHiddenContent(): void
    {
        $post = (new Post())
            ->setTitle('A')
            ->setBody('B')
            ->setModerationState(ModerationState::HIDDEN->value);
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);

        $this->service->moderatePost($post, $moderator, ModerationState::APPROVED->value, null);

        self::assertSame(ModerationState::APPROVED->value, $post->getModerationState());
        self::assertNotNull($post->getModerationDecidedAt());
        self::assertSame($moderator, $post->getModerationDecidedBy());
    }

    public function testRejectRequiresReason(): void
    {
        $post = (new Post())
            ->setTitle('A')
            ->setBody('B')
            ->setModerationState(ModerationState::PENDING_REVIEW->value);
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);

        $this->expectException(BadRequestHttpException::class);
        $this->service->moderatePost($post, $moderator, ModerationState::REJECTED->value, null);
    }

    public function testUserCannotModerateContent(): void
    {
        $post = (new Post())
            ->setTitle('A')
            ->setBody('B')
            ->setModerationState(ModerationState::PENDING_REVIEW->value);
        $user = $this->newUser('user', [UserRole::USER]);

        $this->expectException(AccessDeniedHttpException::class);
        $this->service->moderatePost($post, $user, ModerationState::APPROVED->value, null);
    }

    public function testCannotTargetPendingReviewViaModerationAction(): void
    {
        $post = (new Post())
            ->setTitle('A')
            ->setBody('B')
            ->setModerationState(ModerationState::APPROVED->value);
        $admin = $this->newUser('admin', [UserRole::ADMIN]);

        $this->expectException(BadRequestHttpException::class);
        $this->service->moderatePost($post, $admin, ModerationState::PENDING_REVIEW->value, null);
    }

    public function testDuplicateTargetStateThrowsConflict(): void
    {
        $post = (new Post())
            ->setTitle('A')
            ->setBody('B')
            ->setModerationState(ModerationState::APPROVED->value);
        $admin = $this->newUser('admin', [UserRole::ADMIN]);

        $this->expectException(ConflictHttpException::class);
        $this->service->moderatePost($post, $admin, ModerationState::APPROVED->value, null);
    }

    public function testHideRequiresReason(): void
    {
        $post = (new Post())
            ->setTitle('A')
            ->setBody('B')
            ->setModerationState(ModerationState::PENDING_REVIEW->value);
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);

        $this->expectException(BadRequestHttpException::class);
        $this->service->moderatePost($post, $moderator, ModerationState::HIDDEN->value, null);
    }

    public function testRejectReasonIsTrimmedBeforePersisting(): void
    {
        $post = (new Post())
            ->setTitle('A')
            ->setBody('B')
            ->setModerationState(ModerationState::PENDING_REVIEW->value);
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);

        $this->service->moderatePost($post, $moderator, ModerationState::REJECTED->value, '  policy violation  ');

        self::assertSame(ModerationState::REJECTED->value, $post->getModerationState());
        self::assertSame('policy violation', $post->getModerationReason());
    }

    public function testSubmitForReviewFromRejectedClearsPriorDecisionMetadata(): void
    {
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);
        $post = (new Post())
            ->setTitle('A')
            ->setBody('B')
            ->setModerationState(ModerationState::REJECTED->value)
            ->setModerationDecidedBy($moderator)
            ->setModerationDecidedAt(new \DateTimeImmutable('-1 day'))
            ->setModerationReason('old reason');

        $this->service->submitPostForReview($post);

        self::assertSame(ModerationState::PENDING_REVIEW->value, $post->getModerationState());
        self::assertNotNull($post->getSubmittedForReviewAt());
        self::assertNull($post->getModerationDecidedAt());
        self::assertNull($post->getModerationDecidedBy());
        self::assertNull($post->getModerationReason());
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
