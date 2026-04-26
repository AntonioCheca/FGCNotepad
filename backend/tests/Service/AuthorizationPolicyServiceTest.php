<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\User;
use App\Service\AuthorizationPolicyService;
use App\Util\Enum\UserRole;
use PHPUnit\Framework\TestCase;

class AuthorizationPolicyServiceTest extends TestCase
{
    private AuthorizationPolicyService $policy;

    protected function setUp(): void
    {
        $this->policy = new AuthorizationPolicyService();
    }

    public function testCanEditOwnContentReturnsTrueForSameUserInstance(): void
    {
        $owner = $this->newUser('owner', [UserRole::USER]);

        self::assertTrue($this->policy->canEditOwnContent($owner, $owner));
    }

    public function testCanEditOwnContentReturnsFalseForDifferentUsers(): void
    {
        $owner = $this->newUser('owner', [UserRole::USER]);
        $actor = $this->newUser('actor', [UserRole::USER]);

        self::assertFalse($this->policy->canEditOwnContent($actor, $owner));
    }

    public function testCanEditOwnContentReturnsFalseWhenActorOrOwnerMissing(): void
    {
        $owner = $this->newUser('owner', [UserRole::USER]);

        self::assertFalse($this->policy->canEditOwnContent(null, $owner));
        self::assertFalse($this->policy->canEditOwnContent($owner, null));
    }

    public function testCanEditAnyContentRoleMatrix(): void
    {
        $user = $this->newUser('user', [UserRole::USER]);
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);
        $admin = $this->newUser('admin', [UserRole::ADMIN]);

        self::assertFalse($this->policy->canEditAnyContent($user));
        self::assertTrue($this->policy->canEditAnyContent($moderator));
        self::assertTrue($this->policy->canEditAnyContent($admin));
        self::assertFalse($this->policy->canEditAnyContent(null));
    }

    public function testCanModerateContentRoleMatrix(): void
    {
        $user = $this->newUser('user', [UserRole::USER]);
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);
        $admin = $this->newUser('admin', [UserRole::ADMIN]);

        self::assertFalse($this->policy->canModerateContent($user));
        self::assertTrue($this->policy->canModerateContent($moderator));
        self::assertTrue($this->policy->canModerateContent($admin));
        self::assertFalse($this->policy->canModerateContent(null));
    }

    public function testCanManageUsersRoleMatrix(): void
    {
        $user = $this->newUser('user', [UserRole::USER]);
        $moderator = $this->newUser('moderator', [UserRole::MODERATOR]);
        $admin = $this->newUser('admin', [UserRole::ADMIN]);

        self::assertFalse($this->policy->canManageUsers($user));
        self::assertFalse($this->policy->canManageUsers($moderator));
        self::assertTrue($this->policy->canManageUsers($admin));
        self::assertFalse($this->policy->canManageUsers(null));
    }

    public function testMixedRoleUserRetainsHighestPermissionExpectations(): void
    {
        $adminModerator = $this->newUser('admin_mod', [UserRole::ADMIN, UserRole::MODERATOR]);

        self::assertTrue($this->policy->canEditAnyContent($adminModerator));
        self::assertTrue($this->policy->canModerateContent($adminModerator));
        self::assertTrue($this->policy->canManageUsers($adminModerator));
    }

    public function testNullActorReturnsFalseAcrossPolicyChecks(): void
    {
        self::assertFalse($this->policy->canEditAnyContent(null));
        self::assertFalse($this->policy->canModerateContent(null));
        self::assertFalse($this->policy->canManageUsers(null));
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
