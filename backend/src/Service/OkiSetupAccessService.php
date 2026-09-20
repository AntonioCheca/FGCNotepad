<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\OkiSetup;
use App\Entity\User;
use App\Util\Enum\ModerationState;

final class OkiSetupAccessService
{
    public function __construct(private readonly AuthorizationPolicyService $authorizationPolicyService)
    {
    }

    public function canView(OkiSetup $setup, ?User $viewer): bool
    {
        return ModerationState::APPROVED->value === $setup->getModerationState() || $this->canEdit($setup, $viewer);
    }

    public function canEdit(OkiSetup $setup, ?User $actor): bool
    {
        return $this->authorizationPolicyService->canEditAnyContent($actor)
            || $this->authorizationPolicyService->canEditOwnContent($actor, $setup->getAuthor());
    }

    public function canModerate(?User $actor): bool
    {
        return $this->authorizationPolicyService->canModerateContent($actor);
    }
}
